using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;
using Sentinel.Application.Config.Get;
using Sentinel.Domain.DTOs.Config;

namespace Sentinel.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/config")]
[Route("api/v{version:apiVersion}/config")]
public class ConfigController : BaseController
{
    [HttpGet]
    public ActionResult<AppConfigDto> Get([FromServices] AppConfigGetService service) =>
        ToActionResult(service.Execute());
}
