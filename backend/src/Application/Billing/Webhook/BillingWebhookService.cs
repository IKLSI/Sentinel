using Hangfire;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.Settings;
using Stripe;
using PlanTier = Sentinel.Domain.Models.PlanTier;
using Session = Stripe.Checkout.Session;

namespace Sentinel.Application.Billing.Webhook;

public class BillingWebhookService : IService
{
    private static readonly TimeSpan StaleClaimDelay = TimeSpan.FromMinutes(15);

    private readonly IOrganizationRepository _organizationRepository;
    private readonly IProjectRepository _projectRepository;
    private readonly IUserRepository _userRepository;
    private readonly IProcessedStripeEventRepository _processedStripeEventRepository;
    private readonly ICommitScopeFactory _commitScopeFactory;
    private readonly StripePriceCatalog _priceCatalog;
    private readonly FrontendSettings _frontend;
    private readonly ISystemScope _systemScope;
    private readonly IBackgroundJobClient _backgroundJobs;
    private readonly ILogger<BillingWebhookService> _logger;

    public BillingWebhookService(
        IOrganizationRepository organizationRepository,
        IProjectRepository projectRepository,
        IUserRepository userRepository,
        IProcessedStripeEventRepository processedStripeEventRepository,
        ICommitScopeFactory commitScopeFactory,
        StripePriceCatalog priceCatalog,
        IOptions<FrontendSettings> frontendOptions,
        ISystemScope systemScope,
        IBackgroundJobClient backgroundJobs,
        ILogger<BillingWebhookService> logger)
    {
        _organizationRepository = organizationRepository;
        _projectRepository = projectRepository;
        _userRepository = userRepository;
        _processedStripeEventRepository = processedStripeEventRepository;
        _commitScopeFactory = commitScopeFactory;
        _priceCatalog = priceCatalog;
        _frontend = frontendOptions.Value;
        _systemScope = systemScope;
        _backgroundJobs = backgroundJobs;
        _logger = logger;
    }

    public async Task<Result> ExecuteAsync(BillingWebhookModel model, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(_priceCatalog.WebhookSecret))
            throw new InvalidOperationException("Stripe:WebhookSecret is missing");

        Event stripeEvent;

        try
        {
            stripeEvent = EventUtility.ConstructEvent(model.Payload, model.Signature, _priceCatalog.WebhookSecret,
                throwOnApiVersionMismatch: false);
        }
        catch (StripeException exception)
        {
            _logger.LogWarning(exception, "Invalid Stripe webhook");
            return Result.Error();
        }

        using IDisposable elevation = _systemScope.Enter();

        bool claimed = await _processedStripeEventRepository
            .TryClaimAsync(stripeEvent.Id, DateTime.UtcNow - StaleClaimDelay, cancellationToken);

        if (!claimed)
        {
            _logger.LogInformation("Stripe event {EventId} already processed or in flight, skipped",
                stripeEvent.Id);
            return Result.Success();
        }

        DateTime eventCreatedAt = stripeEvent.Created;

        try
        {
            switch (stripeEvent.Type)
            {
                case "checkout.session.completed":
                    if (stripeEvent.Data.Object is Session session)
                        await ApplyCheckoutCompletedAsync(session, eventCreatedAt, cancellationToken);
                    break;

                case "customer.subscription.created":
                case "customer.subscription.updated":
                    if (stripeEvent.Data.Object is Subscription subscription)
                        await ApplySubscriptionUpdateAsync(subscription, eventCreatedAt, cancellationToken);
                    break;

                case "customer.subscription.deleted":
                    if (stripeEvent.Data.Object is Subscription canceled)
                        await ApplySubscriptionCanceledAsync(canceled, eventCreatedAt, cancellationToken);
                    break;
            }
        }
        catch
        {
            await TryReleaseClaimAsync(stripeEvent.Id);
            throw;
        }

        await _processedStripeEventRepository.MarkCompletedAsync(stripeEvent.Id, CancellationToken.None);

        return Result.Success();
    }

    private async Task TryReleaseClaimAsync(string stripeEventId)
    {
        try
        {
            await _processedStripeEventRepository.ReleaseAsync(stripeEventId, CancellationToken.None);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception,
                "Unable to release the Stripe event {EventId} claim: it will be replayable after {Delay}",
                stripeEventId, StaleClaimDelay);
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

    private async Task ApplyCheckoutCompletedAsync(Session session, DateTime eventCreatedAt,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(session.ClientReferenceId, out Guid organizationId)) return;

        Organization? organization = await _organizationRepository.GetOrDefaultAsync(organizationId,
            QueryTracking.Tracked, cancellationToken);

        if (organization == null) return;

        if (IsOutdatedEvent(organization, eventCreatedAt))
        {
            _logger.LogInformation(
                "Stripe event older than the current state of {OrganizationId}, skipped", organization.Id);
            return;
        }

        using (ICommitScope commitScope = _commitScopeFactory.Begin())
        {
            organization.LastBillingEventAt = eventCreatedAt;
            organization.StripeCustomerId = session.CustomerId ?? organization.StripeCustomerId;
            organization.StripeSubscriptionId = session.SubscriptionId ?? organization.StripeSubscriptionId;

            if (session.Metadata != null
                && session.Metadata.TryGetValue(StripeMetadataKeys.PlanTier, out string? tierValue)
                && Enum.TryParse(tierValue, out PlanTier tier))
            {
                organization.PlanTier = tier;
            }

            organization.SubscriptionStatus = SubscriptionStatus.Active;
            organization.UpdatedAt = DateTime.UtcNow;

            await commitScope.CommitAsync(cancellationToken);
        }

        await ClampProjectFrequenciesAsync(organizationId,
            PlanLimits.Effective(organization.PlanTier, organization.SubscriptionStatus), cancellationToken);

        _logger.LogInformation("Subscription activated for organization {OrganizationId} ({Plan})",
            organizationId, organization.PlanTier);
    }

    private async Task ApplySubscriptionUpdateAsync(Subscription subscription, DateTime eventCreatedAt,
        CancellationToken cancellationToken)
    {
        Organization? organization = await _organizationRepository
            .GetOrDefaultByStripeReferenceAsync(subscription.Id, subscription.CustomerId, cancellationToken);

        if (organization == null) return;

        if (IsOutdatedEvent(organization, eventCreatedAt))
        {
            _logger.LogInformation(
                "Stripe event older than the current state of {OrganizationId}, skipped", organization.Id);
            return;
        }

        PlanTier previousPlan = organization.PlanTier;
        PlanTier? tier = _priceCatalog.TierFor(subscription.Items?.Data?.FirstOrDefault()?.Price?.Id);

        using (ICommitScope commitScope = _commitScopeFactory.Begin())
        {
            organization.LastBillingEventAt = eventCreatedAt;
            organization.StripeSubscriptionId = subscription.Id;
            organization.SubscriptionStatus = StripePriceCatalog.MapStatus(subscription.Status);

            if (tier.HasValue && organization.SubscriptionStatus is SubscriptionStatus.Active or SubscriptionStatus.Trialing)
                organization.PlanTier = tier.Value;

            organization.UpdatedAt = DateTime.UtcNow;

            await commitScope.CommitAsync(cancellationToken);
        }

        await ClampProjectFrequenciesAsync(organization.Id,
            PlanLimits.Effective(organization.PlanTier, organization.SubscriptionStatus), cancellationToken);

        _logger.LogInformation("Subscription updated for {OrganizationId}: {Status}",
            organization.Id, organization.SubscriptionStatus);

        if (!tier.HasValue || tier.Value == previousPlan) return;

        await NotifyPlanChangedAsync(organization, previousPlan, tier.Value, cancellationToken);
    }

    private async Task ApplySubscriptionCanceledAsync(Subscription subscription, DateTime eventCreatedAt,
        CancellationToken cancellationToken)
    {
        Organization? organization = await _organizationRepository
            .GetOrDefaultByStripeReferenceAsync(subscription.Id, subscription.CustomerId, cancellationToken);

        if (organization == null) return;

        if (IsOutdatedEvent(organization, eventCreatedAt))
        {
            _logger.LogInformation(
                "Stripe event older than the current state of {OrganizationId}, skipped", organization.Id);
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
