using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Sentinel.Domain.Settings;

namespace Sentinel.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/config")]
[Route("api/v{version:apiVersion}/config")]
public class ConfigController : BaseController
{
    private readonly SupportSettings _support;

    public ConfigController(IOptions<SupportSettings> supportOptions)
    {
        _support = supportOptions.Value;
    }

    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            supportEmail = _support.Email,
        });
    }
}
