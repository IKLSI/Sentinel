using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;
using Sentinel.Application.Locales.Get;

namespace Sentinel.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/locales")]
[Route("api/v{version:apiVersion}/locales")]
public class LocalesController : BaseController
{
    [HttpGet("{culture}")]
    public async Task<IActionResult> Get(
        string culture,
        [FromServices] LocaleGetService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(culture, cancellationToken));
}
