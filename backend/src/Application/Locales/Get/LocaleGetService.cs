using System.Text.Json;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;

namespace Sentinel.Application.Locales.Get;

public class LocaleGetService(IContentPathProvider contentPath, LocaleGetValidator validator) : IService
{
    public async Task<Result<JsonElement>> ExecuteAsync(string culture, CancellationToken cancellationToken)
    {
        Result validationResult = await validator.ValidateAsync(culture, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<JsonElement>.From(validationResult);

        string baseDirectory = Path.GetFullPath(Path.Combine(contentPath.ContentRootPath, "Resources", "Locales"));
        string fullPath = Path.GetFullPath(Path.Combine(baseDirectory, $"{culture}.json"));

        if (!fullPath.StartsWith(baseDirectory + Path.DirectorySeparatorChar, StringComparison.Ordinal))
            return Result<JsonElement>.Error(ErrorCodes.LocaleInvalidPath);

        if (!File.Exists(fullPath))
        {
            return Result<JsonElement>.NotFound(
                ErrorCodes.LocaleNotFound,
                new Dictionary<string, string> { ["culture"] = culture });
        }

        await using FileStream stream = File.OpenRead(fullPath);
        using JsonDocument document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

        return Result<JsonElement>.Success(document.RootElement.Clone());
    }
}
