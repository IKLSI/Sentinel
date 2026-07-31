using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Billing;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.Settings;
using Stripe;
using PlanTier = Sentinel.Domain.Models.PlanTier;
using Stripe.Checkout;

namespace Sentinel.Application.Billing.Checkout;

public class BillingCheckoutService : IService
{
    private readonly IOrganizationRepository _organizationRepository;
    private readonly StripeCustomerProvisioner _customerProvisioner;
    private readonly StripePriceCatalog _priceCatalog;
    private readonly IStripeClient _stripeClient;
    private readonly FrontendSettings _frontend;
    private readonly IAuditLogService _auditLog;
    private readonly ITenantContext _tenant;
    private readonly BillingCheckoutValidator _validator;
    private readonly ILogger<BillingCheckoutService> _logger;

    public BillingCheckoutService(
        IOrganizationRepository organizationRepository,
        StripeCustomerProvisioner customerProvisioner,
        StripePriceCatalog priceCatalog,
        IStripeClient stripeClient,
        IOptions<FrontendSettings> frontendOptions,
        IAuditLogService auditLog,
        ITenantContext tenant,
        BillingCheckoutValidator validator,
        ILogger<BillingCheckoutService> logger)
    {
        _organizationRepository = organizationRepository;
        _customerProvisioner = customerProvisioner;
        _priceCatalog = priceCatalog;
        _stripeClient = stripeClient;
        _frontend = frontendOptions.Value;
        _auditLog = auditLog;
        _tenant = tenant;
        _validator = validator;
        _logger = logger;
    }

    public async Task<Result<CheckoutSessionDto>> ExecuteAsync(CheckoutRequest model,
        CancellationToken cancellationToken)
    {
        if (_tenant.OrganizationId is not Guid organizationId)
            return Result<CheckoutSessionDto>.Unauthorized();

        Result validationResult = _validator.Validate(model, out PlanTier tier);

        if (!validationResult.IsSuccess)
            return Result<CheckoutSessionDto>.From(validationResult);

        try
        {
            Result<string> sessionResult = await CreateSessionAsync(organizationId, tier, model.BillingInterval,
                cancellationToken);

            if (!sessionResult.IsSuccess)
                return Result<CheckoutSessionDto>.From(sessionResult);

            await _auditLog.LogAsync(
                AuditAction.CheckoutStarted,
                entityType: AuditEntityTypes.Organization,
                organizationId: organizationId,
                userId: _tenant.UserId,
                entityId: organizationId,
                jti: _tenant.Jti);

            return new CheckoutSessionDto { Url = sessionResult.Value! };
        }
        catch (StripeException exception)
        {
            _logger.LogError(exception, "Stripe error while creating the checkout session");
            return Result<CheckoutSessionDto>.Error(ErrorCodes.BillingProviderUnavailable);
        }
    }

    private async Task<Result<string>> CreateSessionAsync(Guid organizationId, PlanTier tier, string billingInterval,
        CancellationToken cancellationToken)
    {
        Result<string> priceResult = _priceCatalog.PriceIdFor(tier, billingInterval);

        if (!priceResult.IsSuccess)
            return priceResult;

        Organization? organization = await _organizationRepository.GetOrDefaultAsync(organizationId,
            QueryTracking.Tracked, cancellationToken);

        if (organization == null)
            return Result<string>.NotFound(ErrorCodes.NotFound);

        string customerId = await _customerProvisioner.EnsureCustomerAsync(organization, cancellationToken);
        string baseUrl = _frontend.BaseUrl.TrimEnd('/');

        SessionCreateOptions options = new SessionCreateOptions
        {
            Mode = "subscription",
            Customer = customerId,
            ClientReferenceId = organization.Id.ToString(),
            LineItems = [new SessionLineItemOptions { Price = priceResult.Value, Quantity = 1 }],
            SuccessUrl = $"{baseUrl}/settings?billing=success",
            CancelUrl = $"{baseUrl}/settings?billing=cancel",
            Metadata = new Dictionary<string, string>
            {
                [StripeMetadataKeys.OrganizationId] = organization.Id.ToString(),
                [StripeMetadataKeys.PlanTier] = tier.ToString(),
                [StripeMetadataKeys.BillingInterval] = billingInterval
            }
        };

        Session session = await new SessionService(_stripeClient)
            .CreateAsync(options, cancellationToken: cancellationToken);

        return session.Url;
    }
}
