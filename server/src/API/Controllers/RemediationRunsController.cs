using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Sentinel.API.Constants;
using Sentinel.Application.Remediation.CompleteRun;
using Sentinel.Application.Remediation.GetConfig;

namespace Sentinel.API.Controllers;

[ApiController]
[Route("api/remediation-runs")]
[ApiExplorerSettings(IgnoreApi = true)]
public class RemediationRunsController : BaseController
{
    private const string TicketHeader = "X-Remediation-Ticket";

    [HttpGet("{id:guid}/config")]
    [EnableRateLimiting(RateLimitPolicies.RemediationConfig)]
    public async Task<ActionResult<JsonObject>> GetConfig(
        Guid id,
        [FromHeader(Name = TicketHeader)] string? ticket,
        [FromServices] RemediationConfigService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, ticket, cancellationToken));

    [HttpPost("{id:guid}/completion")]
    [EnableRateLimiting(RateLimitPolicies.RemediationCompletion)]
    public async Task<ActionResult> Complete(
        Guid id,
        [FromHeader(Name = TicketHeader)] string? ticket,
        [FromBody] CompleteRemediationRunDto dto,
        [FromServices] CompleteRemediationRunService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, ticket, dto, cancellationToken));
}
