using Microsoft.AspNetCore.Mvc;
using Sentinel.API.Attributes;
using Sentinel.Application.Locales.Get;

namespace Sentinel.API.Controllers;

[ApiController]
[Route("api/locales")]
public class LocalesController : BaseController
{
    [HttpGet("{culture}")]
    [SkipConnectionScope]
    public async Task<IActionResult> Get(
        string culture,
        [FromServices] LocaleGetService service,
        CancellationToken cancellationToken) =>
        ToRevalidatedContentResult(await service.ExecuteAsync(culture, cancellationToken));
}
