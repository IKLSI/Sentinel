using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;

namespace Sentinel.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/config")]
[Route("api/v{version:apiVersion}/config")]
public class ConfigController : BaseController
{
    private readonly IConfiguration _configuration;

    public ConfigController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            supportEmail = _configuration["Support:Email"] ?? string.Empty,
        });
    }
}
