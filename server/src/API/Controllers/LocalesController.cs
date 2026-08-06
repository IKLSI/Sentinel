using Microsoft.AspNetCore.Mvc;
using Sentinel.Application.Locales.Get;

namespace Sentinel.API.Controllers;

[ApiController]
[Route("api/locales")]
public class LocalesController : BaseController
{
    [HttpGet("{culture}")]
    public async Task<IActionResult> Get(
        string culture,
        [FromServices] LocaleGetService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(culture, cancellationToken));
}
