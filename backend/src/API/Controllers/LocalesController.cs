using System.Text.Json;
using System.Text.RegularExpressions;
using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;
using Sentinel.Domain.Constants;

namespace Sentinel.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/locales")]
[Route("api/v{version:apiVersion}/locales")]
public class LocalesController : BaseController
{
    private readonly IWebHostEnvironment _environment;

    private static readonly Regex CulturePattern = new("^[a-zA-Z]{2}(-[a-zA-Z]{2})?$", RegexOptions.Compiled);

    public LocalesController(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    [HttpGet("{culture}")]
    public async Task<IActionResult> Get(string culture, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(culture) || !CulturePattern.IsMatch(culture))
            return BadRequestCode(ErrorCodes.LocaleInvalidCulture);

        string baseDir = Path.GetFullPath(Path.Combine(_environment.ContentRootPath, "Resources", "Locales"));
        string fileName = $"{culture}.json";
        string fullPath = Path.GetFullPath(Path.Combine(baseDir, fileName));

        if (!fullPath.StartsWith(baseDir + Path.DirectorySeparatorChar, StringComparison.Ordinal))
            return BadRequestCode(ErrorCodes.LocaleInvalidPath);

        if (!System.IO.File.Exists(fullPath))
            return NotFoundCode(ErrorCodes.LocaleNotFound, new Dictionary<string, string> { ["culture"] = culture });

        await using FileStream stream = System.IO.File.OpenRead(fullPath);
        using JsonDocument document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        return Ok(document.RootElement.Clone());
    }
}
