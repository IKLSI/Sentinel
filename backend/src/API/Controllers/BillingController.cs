using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sentinel.API.Attributes;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Billing;
using Sentinel.Domain.Models;
using Sentinel.Application.Services;
using Sentinel.Infrastructure.Data;

namespace Sentinel.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/billing")]
[Route("api/v{version:apiVersion}/billing")]
[Authorize]
public class BillingController : BaseController
{
    private readonly QuotaService _quotaService;
    private readonly BillingService _billingService;
    private readonly SentinelContext _context;
    private readonly ISystemScope _systemScope;
    private readonly IAuditLogService _auditLog;
    private readonly ILogger<BillingController> _logger;

    public BillingController(
        QuotaService quotaService,
        BillingService billingService,
        SentinelContext context,
        ISystemScope systemScope,
        IAuditLogService auditLog,
        ILogger<BillingController> logger)
    {
        _quotaService = quotaService;
        _billingService = billingService;
        _context = context;
        _systemScope = systemScope;
        _auditLog = auditLog;
        _logger = logger;
    }

    [HttpGet("status")]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
    public async Task<ActionResult<BillingStatusDto>> GetStatus()
    {
        Guid? organizationId = GetOrganizationId();

        if (organizationId == null) return Unauthorized();

        return Ok(await _quotaService.GetStatusAsync(organizationId.Value));
    }

    [HttpGet("plans")]
    [AuthorizeRoles(UserRole.Admin)]
    public async Task<ActionResult<IEnumerable<PlanOptionDto>>> GetPlans()
    {
        Guid? organizationId = GetOrganizationId();

        if (organizationId == null) return Unauthorized();

        PlanTier tier = await CurrentTierAsync(organizationId.Value);
        return Ok(await _billingService.GetPlansAsync(tier));
    }

    [HttpPost("checkout")]
    [AuthorizeRoles(UserRole.Admin)]
    public async Task<IActionResult> Checkout([FromBody] CheckoutRequest request)
    {
        Guid? organizationId = GetOrganizationId();

        if (organizationId == null) return Unauthorized();

        if (!Enum.TryParse(request.PlanTier, true, out PlanTier tier) || tier == PlanTier.Free)
            return BadRequestCode(ErrorCodes.BillingInvalidPlan);

        try
        {
            string url = await _billingService.CreateCheckoutSessionAsync(organizationId.Value, tier, request.BillingInterval);

            await _auditLog.LogAsync(
                AuditAction.CheckoutStarted,
                entityType: AuditEntityTypes.Organization,
                organizationId: organizationId.Value,
                userId: GetCurrentUserId(),
                entityId: organizationId.Value,
                jti: GetCurrentJti());

            return Ok(new CheckoutSessionDto { Url = url });
        }
        catch (BusinessRuleException ex)
        {
            return BadRequestCode(ex.Code, ex.Params);
        }
        catch (Stripe.StripeException ex)
        {
            _logger.LogError(ex, "Erreur Stripe lors de la création de la session de paiement");
            return BadRequestCode(ErrorCodes.BillingProviderUnavailable);
        }
    }

    [HttpPost("portal")]
    [AuthorizeRoles(UserRole.Admin)]
    public async Task<IActionResult> Portal()
    {
        Guid? organizationId = GetOrganizationId();

        if (organizationId == null) return Unauthorized();

        try
        {
            string url = await _billingService.CreatePortalSessionAsync(organizationId.Value);

            await _auditLog.LogAsync(
                AuditAction.BillingPortalOpened,
                entityType: AuditEntityTypes.Organization,
                organizationId: organizationId.Value,
                userId: GetCurrentUserId(),
                entityId: organizationId.Value,
                jti: GetCurrentJti());

            return Ok(new CheckoutSessionDto { Url = url });
        }
        catch (BusinessRuleException ex)
        {
            return BadRequestCode(ex.Code, ex.Params);
        }
        catch (Stripe.StripeException ex)
        {
            _logger.LogError(ex, "Erreur Stripe lors de l'ouverture du portail de facturation");
            return BadRequestCode(ErrorCodes.BillingProviderUnavailable);
        }
    }

    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> Webhook()
    {
        using StreamReader reader = new StreamReader(Request.Body);

        string json = await reader.ReadToEndAsync();
        string signature = Request.Headers[CustomHeaderNames.StripeSignature].ToString();

        try
        {
            await _billingService.HandleWebhookAsync(json, signature);
            return Ok();
        }
        catch (Stripe.StripeException ex)
        {
            _logger.LogWarning(ex, "Webhook Stripe invalide");
            return BadRequest();
        }
    }

    private async Task<PlanTier> CurrentTierAsync(Guid organizationId)
    {
        using IDisposable elevation = _systemScope.Enter();
        return await _context.Organizations
            .Where(o => o.Id == organizationId)
            .Select(o => o.PlanTier)
            .FirstOrDefaultAsync();
    }
}
