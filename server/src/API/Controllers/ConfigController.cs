using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;
using Sentinel.Application.Config.Get;

namespace Sentinel.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/config")]
public class ConfigController : BaseController
{
    [HttpGet]
    public ActionResult<AppConfigDto> Get([FromServices] AppConfigGetService service) =>
        ToActionResult(service.Execute());
}
