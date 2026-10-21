using System.Collections.Concurrent;
using System.Net;
using System.Text;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Sentinel.Domain.Git;
using Sentinel.Infrastructure.Http;

namespace Sentinel.Tests.Services;

public class RepositoryHostClientGitHubTests
{
    private const string ServerToken = "ghp_server";
    private const string OrganizationToken = "ghp_organization";
    private const string GitHubHost = "github.com";

    private sealed class VisibilityHandler(bool isPrivate) : HttpMessageHandler
    {
        public ConcurrentQueue<(string Path, string? Token)> Requests { get; } = new();

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            string path = request.RequestUri!.AbsolutePath;
            Requests.Enqueue((path, request.Headers.Authorization?.Parameter));

            string body = path.Contains("/commits/")
                ? "abc123"
                : $$"""{ "private": {{(isPrivate ? "true" : "false")}}, "default_branch": "main" }""";

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(body, Encoding.UTF8, "application/json")
            });
        }
    }

    private sealed class StubHttpClientFactory(HttpMessageHandler handler) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => new(handler, disposeHandler: false);
    }

    private static RepositoryHostClient Client(HttpMessageHandler handler, IMemoryCache? cache = null) =>
        new RepositoryHostClient(new StubHttpClientFactory(handler),
            Options.Create(new RepositoryHostSettings { GitHubToken = ServerToken }),
            cache ?? new MemoryCache(new MemoryCacheOptions()),
            NullLogger<RepositoryHostClient>.Instance);

    [Fact]
    public async Task GetHeadCommitAsync_WithoutOrganizationToken_OnPrivateRepository_DoesNotSendServerToken()
    {
        VisibilityHandler handler = new VisibilityHandler(isPrivate: true);

        await Client(handler).GetHeadCommitAsync(GitHubHost, "acme", "secret", null, null,
            CancellationToken.None);

        handler.Requests.Should().Contain(request => request.Path.Contains("/commits/") && request.Token == null);
    }

    [Fact]
    public async Task GetHeadCommitAsync_WithoutOrganizationToken_OnPublicRepository_UsesServerToken()
    {
        VisibilityHandler handler = new VisibilityHandler(isPrivate: false);

        await Client(handler).GetHeadCommitAsync(GitHubHost, "acme", "open", null, null,
            CancellationToken.None);

        handler.Requests.Should().Contain(request => request.Path.Contains("/commits/") && request.Token == ServerToken);
    }

    [Fact]
    public async Task GetHeadCommitAsync_WithOrganizationToken_SkipsVisibilityLookup()
    {
        VisibilityHandler handler = new VisibilityHandler(isPrivate: true);

        await Client(handler).GetHeadCommitAsync(GitHubHost, "acme", "secret",
            new RepositoryAccess(OrganizationToken, GitLabInstance.Public),
            null, CancellationToken.None);

        handler.Requests.Should().ContainSingle()
            .Which.Should().Be(("/repos/acme/secret/commits/HEAD", OrganizationToken));
    }

    [Fact]
    public async Task VisibilityLookup_IsCachedAcrossCalls()
    {
        VisibilityHandler handler = new VisibilityHandler(isPrivate: false);
        MemoryCache cache = new MemoryCache(new MemoryCacheOptions());

        await Client(handler, cache).GetHeadCommitAsync(GitHubHost, "acme", "open", null, null,
            CancellationToken.None);
        await Client(handler, cache).GetHeadCommitAsync(GitHubHost, "acme", "open", null, null,
            CancellationToken.None);

        handler.Requests.Count(request => request.Path == "/repos/acme/open").Should().Be(1);
    }
}
