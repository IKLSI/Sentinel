using System.Text.Json;
using Sentinel.Domain.Abstractions;

namespace Sentinel.Infrastructure.Localization;

public sealed class JsonLocaleCatalogSource(IContentPathProvider contentPath) : ILocaleCatalogSource
{
    public async Task<byte[]?> ReadAsync(string culture, CancellationToken cancellationToken)
    {
        if (LocaleFiles.PathOf(contentPath.ContentRootPath, culture) is not { } path) return null;

        await using FileStream stream = File.OpenRead(path);
        using JsonDocument document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

        return JsonSerializer.SerializeToUtf8Bytes(document.RootElement);
    }
}
