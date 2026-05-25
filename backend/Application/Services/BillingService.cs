using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Stripe;
using Stripe.BillingPortal;
using Stripe.Checkout;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.DTOs.Billing;
using Sentinel.Domain.Models;
using Sentinel.Domain.Settings;
using Sentinel.Infrastructure.Data;
using Session = Stripe.Checkout.Session;
using SessionCreateOptions = Stripe.Checkout.SessionCreateOptions;
using SessionLineItemOptions = Stripe.Checkout.SessionLineItemOptions;
using SessionService = Stripe.Checkout.SessionService;
using PortalSessionCreateOptions = Stripe.BillingPortal.SessionCreateOptions;
using PortalSessionService = Stripe.BillingPortal.SessionService;
using PlanTier = Sentinel.Domain.Models.PlanTier;

namespace Sentinel.Application.Services;

public class BillingService
{
    private readonly SentinelContext _context;
    private readonly StripeSettings _stripe;
    private readonly FrontendSettings _frontend;
    private readonly ILogger<BillingService> _logger;
    private readonly ISystemScope _systemScope;
    private readonly IStripeClient _stripeClient;

    public BillingService(
        SentinelContext context,
        IOptions<StripeSettings> stripeOptions,
        IOptions<FrontendSettings> frontendOptions,
        ILogger<BillingService> logger,
        ISystemScope systemScope,
        IStripeClient stripe)
    {
        _context = context;
        _stripe = stripeOptions.Value;
        _frontend = frontendOptions.Value;
        _logger = logger;
        _systemScope = systemScope;
        _stripeClient = stripe;
    }

    public List<PlanOptionDto> GetPlans(PlanTier currentTier)
    {
        return PlanLimits.ByTier.Select(kvp => new PlanOptionDto
        {
            Tier = kvp.Key.ToString(),
            MaxProjects = kvp.Value.MaxProjects,
            MaxMembers = kvp.Value.MaxMembers,
            MaxScansPerMonth = kvp.Value.MaxScansPerMonth,
            PriceMonthly = kvp.Value.PriceMonthly,
            IsCurrent = kvp.Key == currentTier
        }).ToList();
    }

    public async Task<string> CreateCheckoutSessionAsync(Guid organizationId, PlanTier tier)
    {
        if (tier == PlanTier.Free)
            throw new InvalidOperationException("Le plan gratuit ne nécessite pas de paiement.");

        string priceId = PriceIdForTier(tier);

        using IDisposable elevation = _systemScope.Enter();

        Organization organization = await _context.Organizations.FirstOrDefaultAsync(o => o.Id == organizationId)
            ?? throw new KeyNotFoundException();

        string customerId = await EnsureStripeCustomerAsync(organization);

        string baseUrl = FrontendBaseUrl();

        SessionCreateOptions options = new SessionCreateOptions
        {
            Mode = "subscription",
            Customer = customerId,
            ClientReferenceId = organization.Id.ToString(),
            LineItems = new List<SessionLineItemOptions>
            {
                new() { Price = priceId, Quantity = 1 }
            },
            SuccessUrl = $"{baseUrl}/settings?billing=success",
            CancelUrl = $"{baseUrl}/settings?billing=cancel",
            Metadata = new Dictionary<string, string>
            {
                ["organizationId"] = organization.Id.ToString(),
                ["planTier"] = tier.ToString()
            }
        };

        SessionService service = new SessionService(_stripeClient);
        Session session = await service.CreateAsync(options);

        return session.Url;
    }

    public async Task<string> CreatePortalSessionAsync(Guid organizationId)
    {
        using IDisposable elevation = _systemScope.Enter();

        Organization organization = await _context.Organizations.FirstOrDefaultAsync(o => o.Id == organizationId)
            ?? throw new KeyNotFoundException();

        if (string.IsNullOrEmpty(organization.StripeCustomerId))
            throw new InvalidOperationException("Aucun abonnement actif pour cette organisation.");

        PortalSessionCreateOptions options = new PortalSessionCreateOptions
        {
            Customer = organization.StripeCustomerId,
            ReturnUrl = $"{FrontendBaseUrl()}/settings"
        };

        PortalSessionService service = new PortalSessionService(_stripeClient);
        Stripe.BillingPortal.Session session = await service.CreateAsync(options);

        return session.Url;
    }

    public async Task HandleWebhookAsync(string json, string signatureHeader)
    {
        string webhookSecret = _stripe.WebhookSecret;

        if (string.IsNullOrEmpty(webhookSecret))
            throw new InvalidOperationException("Stripe:WebhookSecret manquant");

        Event stripeEvent = EventUtility.ConstructEvent(json, signatureHeader, webhookSecret, throwOnApiVersionMismatch: false);

        using IDisposable elevation = _systemScope.Enter();

        switch (stripeEvent.Type)
        {
            case "checkout.session.completed":
                if (stripeEvent.Data.Object is Session session)
                    await ApplyCheckoutCompletedAsync(session);
                break;

            case "customer.subscription.created":
            case "customer.subscription.updated":
                if (stripeEvent.Data.Object is Subscription subscription)
                    await ApplySubscriptionUpdateAsync(subscription);
                break;

            case "customer.subscription.deleted":
                if (stripeEvent.Data.Object is Subscription canceled)
                    await ApplySubscriptionCanceledAsync(canceled);
                break;
        }
    }

    private async Task ApplyCheckoutCompletedAsync(Session session)
    {
        if (!Guid.TryParse(session.ClientReferenceId, out Guid organizationId))
            return;

        Organization? organization = await _context.Organizations.FirstOrDefaultAsync(o => o.Id == organizationId);

        if (organization == null) return;

        organization.StripeCustomerId = session.CustomerId ?? organization.StripeCustomerId;
        organization.StripeSubscriptionId = session.SubscriptionId ?? organization.StripeSubscriptionId;

        if (session.Metadata != null
            && session.Metadata.TryGetValue("planTier", out string? tierStr)
            && Enum.TryParse(tierStr, out PlanTier tier))
        {
            organization.PlanTier = tier;
        }

        organization.SubscriptionStatus = SubscriptionStatus.Active;
        organization.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        _logger.LogInformation("Abonnement activé pour l'organisation {OrganizationId} ({Plan})", organizationId, organization.PlanTier);
    }

    private async Task ApplySubscriptionUpdateAsync(Subscription subscription)
    {
        Organization? organization = await FindByCustomerOrSubscriptionAsync(subscription);

        if (organization == null) return;

        organization.StripeSubscriptionId = subscription.Id;
        organization.SubscriptionStatus = MapStatus(subscription.Status);

        string? priceId = subscription.Items?.Data?.FirstOrDefault()?.Price?.Id;
        PlanTier? tier = TierForPriceId(priceId);

        if (tier.HasValue && organization.SubscriptionStatus is SubscriptionStatus.Active or SubscriptionStatus.Trialing)
            organization.PlanTier = tier.Value;

        organization.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Abonnement mis à jour pour {OrganizationId} : {Status}", organization.Id, organization.SubscriptionStatus);
    }

    private async Task ApplySubscriptionCanceledAsync(Subscription subscription)
    {
        Organization? organization = await FindByCustomerOrSubscriptionAsync(subscription);

        if (organization == null) return;

        organization.SubscriptionStatus = SubscriptionStatus.Canceled;
        organization.PlanTier = PlanTier.Free;
        organization.StripeSubscriptionId = null;
        organization.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        _logger.LogInformation("Abonnement annulé pour {OrganizationId} — retour au plan gratuit", organization.Id);
    }

    private Task<Organization?> FindByCustomerOrSubscriptionAsync(Subscription subscription)
    {
        return _context.Organizations.FirstOrDefaultAsync(o =>
            o.StripeSubscriptionId == subscription.Id
            || (subscription.CustomerId != null && o.StripeCustomerId == subscription.CustomerId));
    }

    private async Task<string> EnsureStripeCustomerAsync(Organization organization)
    {
        if (!string.IsNullOrEmpty(organization.StripeCustomerId))
            return organization.StripeCustomerId;

        string? adminEmail = await _context.Users
            .Where(u => u.OrganizationId == organization.Id && u.Role == UserRole.Admin && u.IsActive)
            .OrderBy(u => u.CreatedAt)
            .Select(u => u.Email)
            .FirstOrDefaultAsync();

        CustomerCreateOptions options = new CustomerCreateOptions
        {
            Name = organization.Name,
            Email = adminEmail,
            Metadata = new Dictionary<string, string> { ["organizationId"] = organization.Id.ToString() }
        };

        CustomerService service = new CustomerService(_stripeClient);
        Customer customer = await service.CreateAsync(options);

        organization.StripeCustomerId = customer.Id;
        await _context.SaveChangesAsync();

        return customer.Id;
    }

    private string PriceIdForTier(PlanTier tier)
    {
        string? priceId = tier switch
        {
            PlanTier.Pro => _stripe.Prices.Pro,
            PlanTier.Business => _stripe.Prices.Business,
            _ => null
        };

        if (string.IsNullOrEmpty(priceId))
            throw new InvalidOperationException($"Tarif Stripe non configuré pour le plan {tier}.");

        return priceId;
    }

    private PlanTier? TierForPriceId(string? priceId)
    {
        if (string.IsNullOrEmpty(priceId)) return null;
        if (priceId == _stripe.Prices.Pro) return PlanTier.Pro;
        if (priceId == _stripe.Prices.Business) return PlanTier.Business;
        return null;
    }

    private static SubscriptionStatus MapStatus(string status) => status switch
    {
        "active" => SubscriptionStatus.Active,
        "trialing" => SubscriptionStatus.Trialing,
        "past_due" => SubscriptionStatus.PastDue,
        "canceled" or "unpaid" => SubscriptionStatus.Canceled,
        "incomplete" or "incomplete_expired" => SubscriptionStatus.Incomplete,
        _ => SubscriptionStatus.None
    };

    private string FrontendBaseUrl() => _frontend.BaseUrl.TrimEnd('/');
}
