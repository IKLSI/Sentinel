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
    public async Task FetchRegistryMetadataAsync_SurNpm_QuandLePaquetEstDeprecie_LeSignale()
    {
        Dependency dependency = New("request", DependencyEcosystem.Npm);

        await Fetch(dependency, """{ "version": "2.88.2", "deprecated": "request has been deprecated" }""");

        dependency.IsDeprecated.Should().BeTrue();
    }

    [Fact]
    public async Task FetchRegistryMetadataAsync_SurPackagist_QuandLePaquetEstAbandonne_LeSignale()
    {
        Dependency dependency = New("fzaninotto/faker", DependencyEcosystem.Composer);

        await Fetch(dependency, """{ "package": { "abandoned": true, "versions": { "1.9.2": {} } } }""");

        dependency.IsDeprecated.Should().BeTrue();
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

    [Fact]
    public async Task FetchRegistryMetadataAsync_QuandLeRegistreEstEnPanne_ConserveLesValeursPrecedentes()
    {
        Dependency dependency = New("left-pad", DependencyEcosystem.Npm);
        dependency.LatestVersion = "1.3.0";
        dependency.Publisher = "npm, Inc.";
        dependency.License = "MIT";

        await Fetch(dependency, string.Empty, HttpStatusCode.ServiceUnavailable);

        dependency.LatestVersion.Should().Be("1.3.0");
        dependency.Publisher.Should().Be("npm, Inc.");
        dependency.License.Should().Be("MIT");
    }

    [Fact]
    public async Task FetchRegistryMetadataAsync_QuandLeRegistreEstEnPanne_NeMetPasLEchecEnCache()
    {
        MemoryCache cache = new(new MemoryCacheOptions { SizeLimit = 100 });
        Dependency failed = New("left-pad", DependencyEcosystem.Npm);
        Dependency recovered = New("left-pad", DependencyEcosystem.Npm);

        await Fetch(failed, string.Empty, HttpStatusCode.ServiceUnavailable, cache);
        await Fetch(recovered, """{ "version": "1.3.0" }""", HttpStatusCode.OK, cache);

        recovered.LatestVersion.Should().Be("1.3.0");
    }

    private static Dependency New(string name, DependencyEcosystem ecosystem) => new()
    {
        Name = name,
        CurrentVersion = "1.0.0",
        Ecosystem = ecosystem
    };

    private static async Task Fetch(Dependency dependency, string payload,
        HttpStatusCode status = HttpStatusCode.OK, IMemoryCache? cache = null)
    {
        DependencyRegistryClient client = new(
            new StubHttpClientFactory(new StubHandler(payload, status)),
            cache ?? new MemoryCache(new MemoryCacheOptions { SizeLimit = 100 }),
            new InFlightRequestCoalescer());

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
