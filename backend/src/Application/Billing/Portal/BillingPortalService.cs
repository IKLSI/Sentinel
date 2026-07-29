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
using Stripe.BillingPortal;

namespace Sentinel.Application.Billing.Portal;

public class BillingPortalService : IService
{
    private readonly IOrganizationRepository _organizationRepository;
    private readonly IStripeClient _stripeClient;
    private readonly FrontendSettings _frontend;
    private readonly ISystemScope _systemScope;
    private readonly IAuditLogService _auditLog;
    private readonly ITenantContext _tenant;
    private readonly ILogger<BillingPortalService> _logger;

    public BillingPortalService(
        IOrganizationRepository organizationRepository,
        IStripeClient stripeClient,
        IOptions<FrontendSettings> frontendOptions,
        ISystemScope systemScope,
        IAuditLogService auditLog,
        ITenantContext tenant,
        ILogger<BillingPortalService> logger)
    {
        _organizationRepository = organizationRepository;
        _stripeClient = stripeClient;
        _frontend = frontendOptions.Value;
        _systemScope = systemScope;
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
        catch (StripeException exception)
        {
            _logger.LogError(exception, "Erreur Stripe lors de l'ouverture du portail de facturation");
            return Result<CheckoutSessionDto>.Error(ErrorCodes.BillingProviderUnavailable);
        }
    }

    private async Task<Result<string>> CreatePortalSessionAsync(Guid organizationId,
        CancellationToken cancellationToken)
    {
        using IDisposable elevation = _systemScope.Enter();

        Organization? organization = await _organizationRepository.GetOrDefaultAsync(organizationId,
            QueryTracking.NoTracking, cancellationToken);

        if (organization == null)
            return Result<string>.NotFound(ErrorCodes.NotFound);

        if (string.IsNullOrEmpty(organization.StripeCustomerId))
            return Result<string>.Error(ErrorCodes.BillingNoActiveSubscription);

        SessionCreateOptions options = new SessionCreateOptions
        {
            Customer = organization.StripeCustomerId,
            ReturnUrl = $"{_frontend.BaseUrl.TrimEnd('/')}/settings"
        };

        Session session = await new SessionService(_stripeClient)
            .CreateAsync(options, cancellationToken: cancellationToken);

        return session.Url;
    }
}
