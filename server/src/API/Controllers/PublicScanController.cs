using Sentinel.API.Attributes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Sentinel.API.Constants;
using Sentinel.Application.TechHealth.PublicScan;

namespace Sentinel.API.Controllers;

[ApiController]
[Route("api/public/scan")]
public class PublicScanController : BaseController
{
    [HttpPost]
    [SkipConnectionScope]
    [EnableRateLimiting(RateLimitPolicies.PublicScan)]
    public async Task<ActionResult<PublicScanResponse>> Scan(
        [FromBody] PublicScanRequest request,
        [FromServices] PublicScanService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(request, cancellationToken));
}
