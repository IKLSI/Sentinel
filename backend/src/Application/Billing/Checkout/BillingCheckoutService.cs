using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Audit;
using Sentinel.Application.Common;
using Sentinel.Application.Options;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Billing;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Billing.Checkout;

public class BillingCheckoutService : IService
{
    private readonly IOrganizationRepository _organizationRepository;
    private readonly BillingCustomerProvisioner _customerProvisioner;
    private readonly BillingPriceCatalog _priceCatalog;
    private readonly IBillingGateway _billingGateway;
    private readonly FrontendSettings _frontend;
    private readonly IAuditLogService _auditLog;
    private readonly ITenantContext _tenant;
    private readonly BillingCheckoutValidator _validator;
    private readonly ILogger<BillingCheckoutService> _logger;

    public BillingCheckoutService(
        IOrganizationRepository organizationRepository,
        BillingCustomerProvisioner customerProvisioner,
        BillingPriceCatalog priceCatalog,
        IBillingGateway billingGateway,
        IOptions<FrontendSettings> frontendOptions,
        IAuditLogService auditLog,
        ITenantContext tenant,
        BillingCheckoutValidator validator,
        ILogger<BillingCheckoutService> logger)
    {
        _organizationRepository = organizationRepository;
        _customerProvisioner = customerProvisioner;
        _priceCatalog = priceCatalog;
        _billingGateway = billingGateway;
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
        catch (BillingProviderException exception)
        {
            _logger.LogError(exception, "Billing provider error while creating the checkout session");
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

        BillingCheckoutRequest request = new(
            organization.Id,
            customerId,
            priceResult.Value!,
            tier,
            billingInterval,
            $"{baseUrl}/settings?billing=success",
            $"{baseUrl}/settings?billing=cancel");

        return await _billingGateway.CreateCheckoutSessionAsync(request, cancellationToken);
    }
}
