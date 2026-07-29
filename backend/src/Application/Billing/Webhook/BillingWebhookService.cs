using Hangfire;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
using Sentinel.Application.Exports;
using Sentinel.Application.Notifications;
using Sentinel.Application.Security;
using Sentinel.Application.TechHealth;
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
    private readonly IOrganizationRepository _organizationRepository;
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWorkManager _unitOfWorkManager;
    private readonly StripePriceCatalog _priceCatalog;
    private readonly FrontendSettings _frontend;
    private readonly ISystemScope _systemScope;
    private readonly IBackgroundJobClient _backgroundJobs;
    private readonly ILogger<BillingWebhookService> _logger;

    public BillingWebhookService(
        IOrganizationRepository organizationRepository,
        IUserRepository userRepository,
        IUnitOfWorkManager unitOfWorkManager,
        StripePriceCatalog priceCatalog,
        IOptions<FrontendSettings> frontendOptions,
        ISystemScope systemScope,
        IBackgroundJobClient backgroundJobs,
        ILogger<BillingWebhookService> logger)
    {
        _organizationRepository = organizationRepository;
        _userRepository = userRepository;
        _unitOfWorkManager = unitOfWorkManager;
        _priceCatalog = priceCatalog;
        _frontend = frontendOptions.Value;
        _systemScope = systemScope;
        _backgroundJobs = backgroundJobs;
        _logger = logger;
    }

    public async Task<Result> ExecuteAsync(BillingWebhookModel model, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(_priceCatalog.WebhookSecret))
            throw new InvalidOperationException("Stripe:WebhookSecret manquant");

        Event stripeEvent;

        try
        {
            stripeEvent = EventUtility.ConstructEvent(model.Payload, model.Signature, _priceCatalog.WebhookSecret,
                throwOnApiVersionMismatch: false);
        }
        catch (StripeException exception)
        {
            _logger.LogWarning(exception, "Webhook Stripe invalide");
            return Result.Error();
        }

        using IDisposable elevation = _systemScope.Enter();

        switch (stripeEvent.Type)
        {
            case "checkout.session.completed":
                if (stripeEvent.Data.Object is Session session)
                    await ApplyCheckoutCompletedAsync(session, cancellationToken);
                break;

            case "customer.subscription.created":
            case "customer.subscription.updated":
                if (stripeEvent.Data.Object is Subscription subscription)
                    await ApplySubscriptionUpdateAsync(subscription, cancellationToken);
                break;

            case "customer.subscription.deleted":
                if (stripeEvent.Data.Object is Subscription canceled)
                    await ApplySubscriptionCanceledAsync(canceled, cancellationToken);
                break;
        }

        return Result.Success();
    }

    private async Task ApplyCheckoutCompletedAsync(Session session, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(session.ClientReferenceId, out Guid organizationId)) return;

        Organization? organization = await _organizationRepository.GetOrDefaultAsync(organizationId,
            new SingleEntityQueryOptions<Organization>(), cancellationToken);

        if (organization == null) return;

        using (IUnitOfWork unitOfWork = _unitOfWorkManager.NewUnitOfWork())
        {
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

            await unitOfWork.CommitAsync(cancellationToken);
        }

        _logger.LogInformation("Abonnement activé pour l'organisation {OrganizationId} ({Plan})",
            organizationId, organization.PlanTier);
    }

    private async Task ApplySubscriptionUpdateAsync(Subscription subscription, CancellationToken cancellationToken)
    {
        Organization? organization = await _organizationRepository
            .GetOrDefaultByStripeReferenceAsync(subscription.Id, subscription.CustomerId, cancellationToken);

        if (organization == null) return;

        PlanTier previousPlan = organization.PlanTier;
        PlanTier? tier = _priceCatalog.TierFor(subscription.Items?.Data?.FirstOrDefault()?.Price?.Id);

        using (IUnitOfWork unitOfWork = _unitOfWorkManager.NewUnitOfWork())
        {
            organization.StripeSubscriptionId = subscription.Id;
            organization.SubscriptionStatus = StripePriceCatalog.MapStatus(subscription.Status);

            if (tier.HasValue && organization.SubscriptionStatus is SubscriptionStatus.Active or SubscriptionStatus.Trialing)
                organization.PlanTier = tier.Value;

            organization.UpdatedAt = DateTime.UtcNow;

            await unitOfWork.CommitAsync(cancellationToken);
        }

        _logger.LogInformation("Abonnement mis à jour pour {OrganizationId} : {Status}",
            organization.Id, organization.SubscriptionStatus);

        if (!tier.HasValue || tier.Value == previousPlan) return;

        await NotifyPlanChangedAsync(organization, previousPlan, tier.Value, cancellationToken);
    }

    private async Task ApplySubscriptionCanceledAsync(Subscription subscription, CancellationToken cancellationToken)
    {
        Organization? organization = await _organizationRepository
            .GetOrDefaultByStripeReferenceAsync(subscription.Id, subscription.CustomerId, cancellationToken);

        if (organization == null) return;

        using (IUnitOfWork unitOfWork = _unitOfWorkManager.NewUnitOfWork())
        {
            organization.SubscriptionStatus = SubscriptionStatus.Canceled;
            organization.PlanTier = PlanTier.Free;
            organization.StripeSubscriptionId = null;
            organization.UpdatedAt = DateTime.UtcNow;

            await unitOfWork.CommitAsync(cancellationToken);
        }

        _logger.LogInformation("Abonnement annulé pour {OrganizationId} — retour au plan gratuit", organization.Id);

        List<string> adminEmails = await _userRepository
            .GetActiveAdminEmailsAsync(organization.Id, cancellationToken);

        if (adminEmails.Count == 0) return;

        string organizationName = organization.Name;
        string billingUrl = BillingUrl;

        _backgroundJobs.Enqueue<IEmailService>(s =>
            s.SendSubscriptionCanceledAsync(adminEmails, organizationName, billingUrl));
    }

    private async Task NotifyPlanChangedAsync(Organization organization, PlanTier previousPlan, PlanTier newPlan,
        CancellationToken cancellationToken)
    {
        List<string> adminEmails = await _userRepository
            .GetActiveAdminEmailsAsync(organization.Id, cancellationToken);

        if (adminEmails.Count == 0) return;

        string organizationName = organization.Name;
        string oldPlanName = previousPlan.ToString();
        string newPlanName = newPlan.ToString();
        string billingUrl = BillingUrl;
        string statusMessage = organization.SubscriptionStatus switch
        {
            SubscriptionStatus.Active => "Abonnement actif.",
            SubscriptionStatus.Trialing => "Période d'essai en cours.",
            SubscriptionStatus.PastDue => "Paiement en retard — veuillez régulariser votre situation.",
            _ => $"Statut : {organization.SubscriptionStatus}"
        };

        _backgroundJobs.Enqueue<IEmailService>(s => s.SendSubscriptionUpdatedAsync(
            adminEmails, organizationName, oldPlanName, newPlanName, statusMessage, billingUrl));
    }

    private string BillingUrl => $"{_frontend.BaseUrl}/settings";
}
