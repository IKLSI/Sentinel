using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Net.Http.Headers;
using Sentinel.API.Constants;
using Sentinel.Application.Common;
using Sentinel.Application.TechHealth.ProjectBadge;
using Sentinel.Domain.Constants;

namespace Sentinel.API.Controllers;

[ApiController]
[Route("api/public/badge")]
public class PublicBadgeController : BaseController
{
    private static readonly string PublicCacheControl =
        $"public, max-age={(int)CacheKeys.ProjectBadgeTtl.TotalSeconds}";

    [HttpGet("{token}.svg")]
    [EnableRateLimiting(RateLimitPolicies.PublicBadge)]
    public async Task<ActionResult> ProjectBadge(
        string token,
        [FromServices] ProjectBadgeRenderService service,
        CancellationToken cancellationToken)
    {
        Result<VersionedContent> result = await service.ExecuteAsync(token, cancellationToken);

        Response.Headers.CacheControl = PublicCacheControl;

        return File(result.Value!.Content, result.Value.ContentType, null, new EntityTagHeaderValue(result.Value.ETag));
    }
}
