using Sentinel.API.Constants;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Sentinel.API.Attributes;
using Sentinel.Application.Billing.Checkout;
using Sentinel.Application.Billing.GetPlans;
using Sentinel.Application.Billing.GetStatus;
using Sentinel.Application.Billing.Webhook;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Application.Billing;

namespace Sentinel.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/billing")]
[Route("api/v{version:apiVersion}/billing")]
[Authorize]
public class BillingController : BaseController
{
    private const int WebhookRequestSizeLimitBytes = 512 * 1024;

    [HttpGet("status")]
    [AuthorizeRoles(UserRole.Admin, UserRole.Developer)]
    public async Task<ActionResult<BillingStatusDto>> GetStatus(
        [FromServices] BillingStatusService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(cancellationToken));

    [HttpGet("plans")]
    [AuthorizeRoles(UserRole.Admin)]
    public async Task<ActionResult<List<PlanOptionDto>>> GetPlans(
        [FromServices] BillingPlanListService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(cancellationToken));

    [HttpPost("checkout")]
    [AuthorizeRoles(UserRole.Admin)]
    public async Task<ActionResult<CheckoutSessionDto>> Checkout(
        [FromBody] CheckoutRequest request,
        [FromServices] BillingCheckoutService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(request, cancellationToken));

    [HttpPost("webhook")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.Webhook)]
    [RequestSizeLimit(WebhookRequestSizeLimitBytes)]
    public async Task<IActionResult> Webhook(
        [FromServices] BillingWebhookService service,
        CancellationToken cancellationToken)
    {
        using StreamReader reader = new StreamReader(Request.Body);

        BillingWebhookModel model = new()
        {
            Payload = await reader.ReadToEndAsync(cancellationToken),
            Signature = Request.Headers[CustomHeaderNames.StripeSignature].ToString()
        };

        return ToActionResult(await service.ExecuteAsync(model, cancellationToken));
    }
}
