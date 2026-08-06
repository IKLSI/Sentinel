using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Options;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Billing;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Realtime;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Billing.Webhook;

public class BillingWebhookService : IService
{
    private static readonly TimeSpan StaleClaimDelay = TimeSpan.FromMinutes(15);

    private readonly IOrganizationRepository _organizationRepository;
    private readonly IProjectRepository _projectRepository;
    private readonly IUserRepository _userRepository;
    private readonly IProcessedStripeEventRepository _processedStripeEventRepository;
    private readonly ICommitScopeFactory _commitScopeFactory;
    private readonly BillingPriceCatalog _priceCatalog;
    private readonly IBillingWebhookParser _webhookParser;
    private readonly FrontendSettings _frontend;
    private readonly ISystemScope _systemScope;
    private readonly IJobScheduler _backgroundJobs;
    private readonly IRealtimeNotifier _realtimeNotifier;
    private readonly ILogger<BillingWebhookService> _logger;

    public BillingWebhookService(
        IOrganizationRepository organizationRepository,
        IProjectRepository projectRepository,
        IUserRepository userRepository,
        IProcessedStripeEventRepository processedStripeEventRepository,
        ICommitScopeFactory commitScopeFactory,
        BillingPriceCatalog priceCatalog,
        IBillingWebhookParser webhookParser,
        IOptions<FrontendSettings> frontendOptions,
        ISystemScope systemScope,
        IJobScheduler backgroundJobs,
        IRealtimeNotifier realtimeNotifier,
        ILogger<BillingWebhookService> logger)
    {
        _organizationRepository = organizationRepository;
        _projectRepository = projectRepository;
        _userRepository = userRepository;
        _processedStripeEventRepository = processedStripeEventRepository;
        _commitScopeFactory = commitScopeFactory;
        _priceCatalog = priceCatalog;
        _webhookParser = webhookParser;
        _frontend = frontendOptions.Value;
        _systemScope = systemScope;
        _backgroundJobs = backgroundJobs;
        _realtimeNotifier = realtimeNotifier;
        _logger = logger;
    }

    private Task NotifyBillingChangedAsync(Guid organizationId, CancellationToken cancellationToken) =>
        _realtimeNotifier.NotifyOrganizationAsync(organizationId,
            new RealtimeEvent(RealtimeResources.Billing), cancellationToken);

    public async Task<Result> ExecuteAsync(BillingWebhookModel model, CancellationToken cancellationToken)
    {
        BillingWebhookEvent? billingEvent = _webhookParser.ParseOrDefault(model.Payload, model.Signature);

        if (billingEvent == null)
            return Result.Error();

        using IDisposable elevation = _systemScope.Enter();

        bool claimed = await _processedStripeEventRepository
            .TryClaimAsync(billingEvent.Id, DateTime.UtcNow - StaleClaimDelay, cancellationToken);

        if (!claimed)
        {
            _logger.LogInformation("Billing event {EventId} already processed or in flight, skipped",
                billingEvent.Id);
            return Result.Success();
        }

        try
        {
            await DispatchAsync(billingEvent, cancellationToken);
        }
        catch
        {
            await TryReleaseClaimAsync(billingEvent.Id);
            throw;
        }

        await _processedStripeEventRepository.MarkCompletedAsync(billingEvent.Id, CancellationToken.None);

        return Result.Success();
    }

    private async Task DispatchAsync(BillingWebhookEvent billingEvent, CancellationToken cancellationToken)
    {
        switch (billingEvent.Type)
        {
            case BillingWebhookEventType.CheckoutCompleted:
                if (billingEvent.Checkout is { } checkout)
                    await ApplyCheckoutCompletedAsync(checkout, billingEvent.CreatedAt, cancellationToken);
                break;

            case BillingWebhookEventType.SubscriptionChanged:
                if (billingEvent.Subscription is { } subscription)
                    await ApplySubscriptionUpdateAsync(subscription, billingEvent.CreatedAt, cancellationToken);
                break;

            case BillingWebhookEventType.SubscriptionCanceled:
                if (billingEvent.Subscription is { } canceled)
                    await ApplySubscriptionCanceledAsync(canceled, billingEvent.CreatedAt, cancellationToken);
                break;
        }
    }

    private async Task TryReleaseClaimAsync(string billingEventId)
    {
        try
        {
            await _processedStripeEventRepository.ReleaseAsync(billingEventId, CancellationToken.None);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception,
                "Unable to release the billing event {EventId} claim: it will be replayable after {Delay}",
                billingEventId, StaleClaimDelay);
        }
    }

    private static bool IsOutdatedEvent(Organization organization, DateTime eventCreatedAt) =>
        organization.LastBillingEventAt is DateTime lastEventAt && eventCreatedAt < lastEventAt;

    private async Task ClampProjectFrequenciesAsync(Guid organizationId, PlanTier tier,
        CancellationToken cancellationToken)
    {
        PlanLimits limits = PlanLimits.For(tier);
        IReadOnlyCollection<ScanFrequency> tooFrequent = limits.FrequenciesAbovePlan();

        if (tooFrequent.Count == 0) return;

        int clamped = await _projectRepository.ClampScanFrequencyAsync(organizationId, tooFrequent,
            limits.MaxScanFrequency, cancellationToken);

        if (clamped > 0)
        {
            _logger.LogInformation(
                "{Count} project(s) of {OrganizationId} clamped to the {Frequency} frequency enforced by plan {Plan}",
                clamped, organizationId, limits.MaxScanFrequency, tier);
        }
    }

    private async Task ApplyCheckoutCompletedAsync(BillingCheckoutCompleted checkout, DateTime eventCreatedAt,
        CancellationToken cancellationToken)
    {
        if (checkout.OrganizationId is not Guid organizationId) return;

        Organization? organization = await _organizationRepository.GetOrDefaultAsync(organizationId,
            QueryTracking.Tracked, cancellationToken);

        if (organization == null) return;

        if (IsOutdatedEvent(organization, eventCreatedAt))
        {
            _logger.LogInformation(
                "Billing event older than the current state of {OrganizationId}, skipped", organization.Id);
            return;
        }

        using (ICommitScope commitScope = _commitScopeFactory.Begin())
        {
            organization.LastBillingEventAt = eventCreatedAt;
            organization.StripeCustomerId = checkout.CustomerId ?? organization.StripeCustomerId;
            organization.StripeSubscriptionId = checkout.SubscriptionId ?? organization.StripeSubscriptionId;

            if (checkout.Tier is { } tier)
                organization.PlanTier = tier;

            organization.SubscriptionStatus = SubscriptionStatus.Active;
            organization.UpdatedAt = DateTime.UtcNow;

            await commitScope.CommitAsync(cancellationToken);
        }

        await ClampProjectFrequenciesAsync(organizationId, organization.PlanTier, cancellationToken);
        await NotifyBillingChangedAsync(organizationId, cancellationToken);

        _logger.LogInformation("Subscription activated for organization {OrganizationId} ({Plan})",
            organizationId, organization.PlanTier);
    }

    private async Task ApplySubscriptionUpdateAsync(BillingSubscriptionSnapshot subscription, DateTime eventCreatedAt,
        CancellationToken cancellationToken)
    {
        Organization? organization = await _organizationRepository
            .GetOrDefaultByStripeReferenceAsync(subscription.SubscriptionId, subscription.CustomerId, cancellationToken);

        if (organization == null) return;

        if (IsOutdatedEvent(organization, eventCreatedAt))
        {
            _logger.LogInformation(
                "Billing event older than the current state of {OrganizationId}, skipped", organization.Id);
            return;
        }

        PlanTier previousPlan = organization.PlanTier;
        PlanTier? tier = _priceCatalog.TierFor(subscription.PriceId);
        bool planApplied;

        using (ICommitScope commitScope = _commitScopeFactory.Begin())
        {
            organization.LastBillingEventAt = eventCreatedAt;
            organization.StripeSubscriptionId = subscription.SubscriptionId;
            organization.SubscriptionStatus = subscription.Status;

            planApplied = tier.HasValue
                && tier.Value != previousPlan
                && PlanLimits.IsEntitled(organization.SubscriptionStatus);

            if (planApplied)
                organization.PlanTier = tier!.Value;

            organization.UpdatedAt = DateTime.UtcNow;

            await commitScope.CommitAsync(cancellationToken);
        }

        await ClampProjectFrequenciesAsync(organization.Id, organization.PlanTier, cancellationToken);
        await NotifyBillingChangedAsync(organization.Id, cancellationToken);

        _logger.LogInformation("Subscription updated for {OrganizationId}: {Status}",
            organization.Id, organization.SubscriptionStatus);

        if (!planApplied) return;

        await NotifyPlanChangedAsync(organization, previousPlan, organization.PlanTier, cancellationToken);
    }

    private async Task ApplySubscriptionCanceledAsync(BillingSubscriptionSnapshot subscription,
        DateTime eventCreatedAt, CancellationToken cancellationToken)
    {
        Organization? organization = await _organizationRepository
            .GetOrDefaultByStripeReferenceAsync(subscription.SubscriptionId, subscription.CustomerId, cancellationToken);

        if (organization == null) return;

        if (IsOutdatedEvent(organization, eventCreatedAt))
        {
            _logger.LogInformation(
                "Billing event older than the current state of {OrganizationId}, skipped", organization.Id);
            return;
        }

        using (ICommitScope commitScope = _commitScopeFactory.Begin())
        {
            organization.LastBillingEventAt = eventCreatedAt;
            organization.SubscriptionStatus = SubscriptionStatus.Canceled;
            organization.PlanTier = PlanTier.Free;
            organization.StripeSubscriptionId = null;
            organization.UpdatedAt = DateTime.UtcNow;

            await commitScope.CommitAsync(cancellationToken);
        }

        await ClampProjectFrequenciesAsync(organization.Id, PlanTier.Free, cancellationToken);
        await NotifyBillingChangedAsync(organization.Id, cancellationToken);

        _logger.LogInformation("Subscription cancelled for {OrganizationId} — reverted to the free plan", organization.Id);

        List<EmailRecipient> adminRecipients = await _userRepository
            .GetActiveAdminRecipientsAsync(organization.Id, cancellationToken);

        if (adminRecipients.Count == 0) return;

        string organizationName = organization.Name;
        string billingUrl = BillingUrl;

        _backgroundJobs.Enqueue<IEmailService>(s =>
            s.SendSubscriptionCanceledAsync(adminRecipients, organizationName, billingUrl));
    }

    private async Task NotifyPlanChangedAsync(Organization organization, PlanTier previousPlan, PlanTier newPlan,
        CancellationToken cancellationToken)
    {
        List<EmailRecipient> adminRecipients = await _userRepository
            .GetActiveAdminRecipientsAsync(organization.Id, cancellationToken);

        if (adminRecipients.Count == 0) return;

        string organizationName = organization.Name;
        string oldPlanName = previousPlan.ToString();
        string newPlanName = newPlan.ToString();
        string billingUrl = BillingUrl;
        string statusKey = organization.SubscriptionStatus switch
        {
            SubscriptionStatus.Active => "emails.subscription_updated.status_active",
            SubscriptionStatus.Trialing => "emails.subscription_updated.status_trialing",
            SubscriptionStatus.PastDue => "emails.subscription_updated.status_past_due",
            _ => "emails.subscription_updated.status_other"
        };
        string statusValue = organization.SubscriptionStatus.ToString();

        _backgroundJobs.Enqueue<IEmailService>(s => s.SendSubscriptionUpdatedAsync(
            adminRecipients, organizationName, oldPlanName, newPlanName, statusKey, statusValue, billingUrl));
    }

    private string BillingUrl => $"{_frontend.BaseUrl}/settings";
}
