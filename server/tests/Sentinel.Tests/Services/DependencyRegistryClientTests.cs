using System.Net;
using System.Text;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Sentinel.Domain.Entities;
using Sentinel.Infrastructure.Http;

namespace Sentinel.Tests.Services;

public class DependencyRegistryClientTests
{
    [Fact]
    public async Task FetchRegistryMetadataAsync_SurNpm_LitLAuteurEtLaVersion()
    {
        Dependency dependency = New("left-pad", DependencyEcosystem.Npm);

        await Fetch(dependency, """{ "version": "1.3.0", "author": { "name": "npm, Inc." } }""");

        dependency.LatestVersion.Should().Be("1.3.0");
        dependency.Publisher.Should().Be("npm, Inc.");
    }

    [Fact]
    public async Task FetchRegistryMetadataAsync_SurNpm_QuandLAuteurEstUneChaine_LaConserve()
    {
        Dependency dependency = New("left-pad", DependencyEcosystem.Npm);

        await Fetch(dependency, """{ "version": "1.3.0", "author": "Cameron Westland" }""");

        dependency.Publisher.Should().Be("Cameron Westland");
    }

    [Fact]
    public async Task FetchRegistryMetadataAsync_SurNpm_SansAuteur_RetombeSurLesMainteneurs()
    {
        Dependency dependency = New("left-pad", DependencyEcosystem.Npm);

        await Fetch(dependency, """{ "version": "1.3.0", "maintainers": [ { "name": "mainteneur" } ] }""");

        dependency.Publisher.Should().Be("mainteneur");
    }

    [Fact]
    public async Task FetchRegistryMetadataAsync_SurNuGet_LitLePremierAuteur()
    {
        Dependency dependency = New("Serilog", DependencyEcosystem.NuGet);

        await Fetch(dependency,
            """{ "data": [ { "version": "4.0.0", "authors": [ "Serilog Contributors", "Autre" ] } ] }""");

        dependency.LatestVersion.Should().Be("4.0.0");
        dependency.Publisher.Should().Be("Serilog Contributors");
    }

    [Fact]
    public async Task FetchRegistryMetadataAsync_SurPyPI_LitLAuteur()
    {
        Dependency dependency = New("flask", DependencyEcosystem.PyPI);

        await Fetch(dependency, """{ "info": { "version": "3.0.0", "author": "Pallets" } }""");

        dependency.LatestVersion.Should().Be("3.0.0");
        dependency.Publisher.Should().Be("Pallets");
    }

    [Fact]
    public async Task FetchRegistryMetadataAsync_SansAuteurPublie_RetombeSurLeNamespaceDuPaquet()
    {
        Dependency scoped = New("@angular/core", DependencyEcosystem.Npm);
        Dependency go = New("github.com/gin-gonic/gin", DependencyEcosystem.Go);
        Dependency composer = New("symfony/console", DependencyEcosystem.Composer);

        await Fetch(scoped, """{ "version": "18.0.0" }""");
        await Fetch(go, """{ "Version": "v1.10.0" }""");
        await Fetch(composer, """{ "package": { "versions": { "6.4.0": {} } } }""");

        scoped.Publisher.Should().Be("angular");
        go.Publisher.Should().Be("gin-gonic");
        composer.Publisher.Should().Be("symfony");
    }

    [Fact]
    public async Task FetchRegistryMetadataAsync_QuandLeRegistreEchoue_LaisseLePublisherVide()
    {
        Dependency dependency = New("Serilog", DependencyEcosystem.NuGet);

        await Fetch(dependency, string.Empty, HttpStatusCode.NotFound);

        dependency.LatestVersion.Should().BeNull();
        dependency.Publisher.Should().BeNull();
    }

    private static Dependency New(string name, DependencyEcosystem ecosystem) => new()
    {
        Name = name,
        CurrentVersion = "1.0.0",
        Ecosystem = ecosystem
    };

    private static async Task Fetch(Dependency dependency, string payload,
        HttpStatusCode status = HttpStatusCode.OK)
    {
        DependencyRegistryClient client = new(
            new StubHttpClientFactory(new StubHandler(payload, status)),
            new MemoryCache(new MemoryCacheOptions { SizeLimit = 100 }));

        await client.FetchRegistryMetadataAsync([dependency]);
    }

    private sealed class StubHandler(string payload, HttpStatusCode status) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,
            CancellationToken cancellationToken) =>
            Task.FromResult(new HttpResponseMessage(status)
            {
                Content = new StringContent(payload, Encoding.UTF8, "application/json")
            });
    }

    private sealed class StubHttpClientFactory(HttpMessageHandler handler) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => new(handler, disposeHandler: false);
    }
}
