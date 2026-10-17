using System.Collections.Concurrent;
using System.Net;
using System.Text;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Git;
using Sentinel.Infrastructure.Http;

namespace Sentinel.Tests.Services;

public class RepositoryHostClientGitLabTests
{
    private sealed class TreeHandler(int totalPages, bool sendTotalPagesHeader) : HttpMessageHandler
    {
        public ConcurrentBag<int> RequestedPages { get; } = new();

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            int page = int.Parse(request.RequestUri!.Query.TrimStart('?').Split('&')
                .First(part => part.StartsWith("page="))["page=".Length..]);
            RequestedPages.Add(page);

            int count = page < totalPages ? 100 : 1;
            string items = string.Join(',', Enumerable.Range(0, count)
                .Select(index => $$"""{ "name": "f{{page}}-{{index}}.txt", "path": "src/f{{page}}-{{index}}.txt", "type": "blob" }"""));

            HttpResponseMessage response = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent($"[{items}]", Encoding.UTF8, "application/json")
            };

            if (sendTotalPagesHeader)
                response.Headers.Add("X-Total-Pages", totalPages.ToString());

            return Task.FromResult(response);
        }
    }

    private sealed class TokenRecordingHandler : HttpMessageHandler
    {
        public ConcurrentBag<string> Tokens { get; } = new();

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            Tokens.Add(request.Headers.GetValues("PRIVATE-TOKEN").Single());

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("[]", Encoding.UTF8, "application/json")
            });
        }
    }

    private sealed class StubHttpClientFactory(HttpMessageHandler handler) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => new(handler, disposeHandler: false);
    }

    private sealed class RecordingHandler : HttpMessageHandler
    {
        public ConcurrentBag<Uri> RequestedUris { get; } = new();

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            RequestedUris.Add(request.RequestUri!);

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    """[{ "name": "package.json", "path": "app/package.json", "type": "blob" }]""",
                    Encoding.UTF8, "application/json")
            });
        }
    }

    private static readonly RepositoryAccess SelfHosted =
        new RepositoryAccess("glpat-test", new GitLabInstance("https://git.entreprise.fr"));

    private static RepositoryHostClient Client(HttpMessageHandler handler) =>
        new RepositoryHostClient(new StubHttpClientFactory(handler),
            Options.Create(new RepositoryHostSettings()),
            NullLogger<RepositoryHostClient>.Instance);

    [Fact]
    public async Task ListFilesAsync_OnSelfHostedInstance_CallsConfiguredApiWithNestedGroupPath()
    {
        RecordingHandler handler = new RecordingHandler();

        RepositoryFileListing listing = await Client(handler)
            .ListFilesAsync("git.entreprise.fr", "groupe/sous-groupe", "projet", SelfHosted);

        handler.RequestedUris.Should().ContainSingle().Which.AbsoluteUri.Should()
            .StartWith("https://git.entreprise.fr/api/v4/projects/groupe%2Fsous-groupe%2Fprojet/repository/tree");
        listing.Files.Should().ContainSingle().Which.Url.Should().StartWith(
            "https://git.entreprise.fr/api/v4/projects/groupe%2Fsous-groupe%2Fprojet/repository/files/app%2Fpackage.json/raw");
    }

    [Theory]
    [InlineData("git.entreprise.fr", true)]
    [InlineData("github.com", true)]
    [InlineData("gitlab.com", false)]
    [InlineData("evil.example.com", false)]
    public void IsSupported_OnSelfHostedInstance_AcceptsOnlyGitHubAndConfiguredGitLab(string host, bool expected)
    {
        RepositoryHosts.IsSupported(host, SelfHosted.GitLab.Host).Should().Be(expected);
    }

    [Fact]
    public async Task ListFilesAsync_OnSelfHostedInstance_SendsTheOrganizationToken()
    {
        TokenRecordingHandler handler = new TokenRecordingHandler();

        await Client(handler).ListFilesAsync("git.entreprise.fr", "groupe", "projet", SelfHosted);

        handler.Tokens.Should().ContainSingle().Which.Should().Be("glpat-test");
    }

    [Fact]
    public async Task ListFilesAsync_OnUnconfiguredGitLabHost_DoesNotCallAnyApi()
    {
        RecordingHandler handler = new RecordingHandler();

        RepositoryFileListing listing = await Client(handler)
            .ListFilesAsync("gitlab.com", "groupe", "projet", SelfHosted);

        listing.Files.Should().BeEmpty();
        handler.RequestedUris.Should().BeEmpty();
    }

    [Fact]
    public async Task ListFilesAsync_WithTotalPagesHeader_ReturnsEveryPageInOrder()
    {
        TreeHandler handler = new TreeHandler(totalPages: 3, sendTotalPagesHeader: true);

        RepositoryFileListing listing = await Client(handler).ListFilesAsync("gitlab.com", "group", "repo");

        listing.Files.Should().HaveCount(201);
        listing.Files[0].Name.Should().Be("f1-0.txt");
        listing.Files[^1].Name.Should().Be("f3-0.txt");
        listing.Truncated.Should().BeFalse();
        handler.RequestedPages.Should().BeEquivalentTo([1, 2, 3]);
    }

    [Fact]
    public async Task ListFilesAsync_BeyondThePageLimit_IsTruncated()
    {
        TreeHandler handler = new TreeHandler(totalPages: 150, sendTotalPagesHeader: true);

        RepositoryFileListing listing = await Client(handler).ListFilesAsync("gitlab.com", "group", "repo");

        listing.Truncated.Should().BeTrue();
        handler.RequestedPages.Max().Should().Be(100);
        listing.Files.Should().HaveCount(100 * 100);
    }

    [Fact]
    public async Task ListFilesAsync_WithoutTotalPagesHeader_PaginatesSequentially()
    {
        TreeHandler handler = new TreeHandler(totalPages: 2, sendTotalPagesHeader: false);

        RepositoryFileListing listing = await Client(handler).ListFilesAsync("gitlab.com", "group", "repo");

        listing.Files.Should().HaveCount(101);
        listing.Truncated.Should().BeFalse();
    }
}
