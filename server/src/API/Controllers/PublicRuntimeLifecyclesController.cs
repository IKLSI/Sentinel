using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Sentinel.API.Constants;
using Sentinel.Application.RuntimeLifecycles;

namespace Sentinel.API.Controllers;

[ApiController]
[Route("api/public/runtime-lifecycles")]
public class PublicRuntimeLifecyclesController : BaseController
{
    [HttpGet]
    [EnableRateLimiting(RateLimitPolicies.PublicRuntimeLifecycles)]
    public async Task<ActionResult<RuntimeLifecyclesDto>> Get(
        [FromServices] RuntimeLifecyclesGetService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(cancellationToken));
}
