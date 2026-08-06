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
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Billing.Portal;

public class BillingPortalService : IService
{
    private readonly IOrganizationRepository _organizationRepository;
    private readonly IBillingGateway _billingGateway;
    private readonly FrontendSettings _frontend;
    private readonly IAuditLogService _auditLog;
    private readonly ITenantContext _tenant;
    private readonly ILogger<BillingPortalService> _logger;

    public BillingPortalService(
        IOrganizationRepository organizationRepository,
        IBillingGateway billingGateway,
        IOptions<FrontendSettings> frontendOptions,
        IAuditLogService auditLog,
        ITenantContext tenant,
        ILogger<BillingPortalService> logger)
    {
        _organizationRepository = organizationRepository;
        _billingGateway = billingGateway;
        _frontend = frontendOptions.Value;
        _auditLog = auditLog;
        _tenant = tenant;
        _logger = logger;
    }

    public async Task<Result<CheckoutSessionDto>> ExecuteAsync(CancellationToken cancellationToken)
    {
        if (_tenant.OrganizationId is not Guid organizationId)
            return Result<CheckoutSessionDto>.Unauthorized();

        try
        {
            Result<string> sessionResult = await CreatePortalSessionAsync(organizationId, cancellationToken);

            if (!sessionResult.IsSuccess)
                return Result<CheckoutSessionDto>.From(sessionResult);

            await _auditLog.LogAsync(
                AuditAction.BillingPortalOpened,
                entityType: AuditEntityTypes.Organization,
                organizationId: organizationId,
                userId: _tenant.UserId,
                entityId: organizationId,
                jti: _tenant.Jti);

            return new CheckoutSessionDto { Url = sessionResult.Value! };
        }
        catch (BillingProviderException exception)
        {
            _logger.LogError(exception, "Billing provider error while opening the billing portal");
            return Result<CheckoutSessionDto>.Error(ErrorCodes.BillingProviderUnavailable);
        }
    }

    private async Task<Result<string>> CreatePortalSessionAsync(Guid organizationId,
        CancellationToken cancellationToken)
    {
        Organization? organization = await _organizationRepository.GetOrDefaultAsync(organizationId,
            QueryTracking.NoTracking, cancellationToken);

        if (organization == null)
            return Result<string>.NotFound(ErrorCodes.NotFound);

        if (string.IsNullOrEmpty(organization.StripeCustomerId))
            return Result<string>.Error(ErrorCodes.BillingNoActiveSubscription);

        return await _billingGateway.CreatePortalSessionAsync(organization.StripeCustomerId,
            $"{_frontend.BaseUrl.TrimEnd('/')}/settings", cancellationToken);
    }
}
