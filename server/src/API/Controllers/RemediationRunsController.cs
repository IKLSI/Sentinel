using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Sentinel.API.Constants;
using Sentinel.Application.TechHealth.Remediation.GetRemediationConfig;

namespace Sentinel.API.Controllers;

[ApiController]
[Route("api/remediation-runs")]
[ApiExplorerSettings(IgnoreApi = true)]
public class RemediationRunsController : BaseController
{
    private const string ConfigTicketHeader = "X-Remediation-Ticket";

    [HttpGet("{id:guid}/config")]
    [EnableRateLimiting(RateLimitPolicies.RemediationConfig)]
    public async Task<ActionResult<JsonObject>> GetConfig(
        Guid id,
        [FromHeader(Name = ConfigTicketHeader)] string? ticket,
        [FromServices] RemediationConfigService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, ticket, cancellationToken));
}
