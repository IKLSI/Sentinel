using FluentAssertions;
using Sentinel.Domain.Abstractions;
using Sentinel.Infrastructure.Localization;

namespace Sentinel.Tests.Helpers;

public static class TestLocalizer
{
    public static ILocalizer Create() => new JsonLocalizer(new TestContentPathProvider());

    private sealed class TestContentPathProvider : IContentPathProvider
    {
        public string ContentRootPath { get; } = LocateApiContentRoot();

        private static string LocateApiContentRoot()
        {
            string? locale = RepositoryFiles.FindByNameOrDefault("server/src/API/Resources/Locales", "fr-FR.json");

            locale.Should().NotBeNull("les catalogues de traduction sont requis par ces tests");

            return Path.GetFullPath(Path.Combine(Path.GetDirectoryName(locale)!, "..", ".."));
        }
    }
}
