using System.Text;
using FluentAssertions;
using Sentinel.Domain.Abstractions;
using Sentinel.Infrastructure.Localization;

namespace Sentinel.Tests.Services;

public sealed class JsonLocaleCatalogSourceTests : IDisposable
{
    private readonly string _contentRoot = Path.Combine(Path.GetTempPath(), $"sentinel-locales-{Guid.NewGuid():N}");

    public JsonLocaleCatalogSourceTests()
    {
        string localesDirectory = Path.Combine(_contentRoot, "Resources", "Locales");
        Directory.CreateDirectory(localesDirectory);
        File.WriteAllText(Path.Combine(localesDirectory, "fr-FR.json"), "{ \"hello\" : \"bonjour\" }");
    }

    [Fact]
    public async Task ReadAsync_KnownCulture_ReturnsCompactJson()
    {
        byte[]? content = await NewSource().ReadAsync("fr-FR", CancellationToken.None);

        Encoding.UTF8.GetString(content!).Should().Be("{\"hello\":\"bonjour\"}");
    }

    [Theory]
    [InlineData("de-DE")]
    [InlineData("../fr-FR")]
    public async Task ReadAsync_UnknownOrEscapingCulture_ReturnsNull(string culture)
    {
        byte[]? content = await NewSource().ReadAsync(culture, CancellationToken.None);

        content.Should().BeNull();
    }

    public void Dispose() => Directory.Delete(_contentRoot, recursive: true);

    private JsonLocaleCatalogSource NewSource() => new(new FixedContentPath(_contentRoot));

    private sealed class FixedContentPath(string contentRootPath) : IContentPathProvider
    {
        public string ContentRootPath => contentRootPath;
    }
}
