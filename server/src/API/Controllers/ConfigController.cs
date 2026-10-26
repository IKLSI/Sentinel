using Microsoft.AspNetCore.Mvc;
using Sentinel.API.Attributes;
using Sentinel.Application.Config.Get;

namespace Sentinel.API.Controllers;

[ApiController]
[Route("api/config")]
public class ConfigController : BaseController
{
    [HttpGet]
    [SkipConnectionScope]
    public ActionResult<AppConfigDto> Get([FromServices] AppConfigGetService service) =>
        ToActionResult(service.Execute());
}
