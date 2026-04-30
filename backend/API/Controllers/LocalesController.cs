using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace Sentinel.API.Controllers;

[ApiController]
[Route("api/locales")]
public class LocalesController : BaseController
{
    private readonly IWebHostEnvironment _environment;

    public LocalesController(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    [HttpGet("{culture}")]
    public async Task<IActionResult> Get(string culture, CancellationToken cancellationToken)
    {
        string fileName = $"{culture}.json";
        string path = Path.Combine(_environment.ContentRootPath, "Resources", "Locales", fileName);

        if (!System.IO.File.Exists(path))
            return NotFound(new { message = $"Locale {culture} introuvable" });

        await using FileStream stream = System.IO.File.OpenRead(path);
        using JsonDocument document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        return Ok(document.RootElement.Clone());
    }
}
