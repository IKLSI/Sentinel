using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Git;
using Sentinel.Infrastructure.Http.RepositoryHosting;

namespace Sentinel.Infrastructure.Http;

public class RepositoryHostClient : IRepositoryHostClient
{
    private readonly GitHubRepositoryHost gitHubHost;
    private readonly GitLabRepositoryHost gitLabHost;

    public RepositoryHostClient(
        IHttpClientFactory httpClientFactory,
        IOptions<RepositoryHostSettings> settings,
        IMemoryCache cache,
        ILogger<RepositoryHostClient> logger)
    {
        RepositoryHostHttp http = new(logger);

        gitHubHost = new GitHubRepositoryHost(httpClientFactory, settings, cache, http, logger);
        gitLabHost = new GitLabRepositoryHost(httpClientFactory, http, logger);
    }

    public async Task<RepositoryListing> ListUserRepositoriesAsync(string token, string platform,
        GitLabInstance gitLab, CancellationToken cancellationToken)
    {
        if (IsGitHubPlatform(platform))
            return await gitHubHost.ListUserRepositoriesAsync(token, cancellationToken);
        if (IsGitLabPlatform(platform))
            return await gitLabHost.ListUserRepositoriesAsync(token, gitLab, cancellationToken);
        return new RepositoryListing(true, null, [], false);
    }

    public async Task<(string Id, string Login)?> GetAuthenticatedAccountAsync(string token, string platform,
        GitLabInstance gitLab, CancellationToken cancellationToken)
    {
        if (IsGitHubPlatform(platform))
            return await gitHubHost.GetAccountAsync(token, cancellationToken);
        if (IsGitLabPlatform(platform))
            return await gitLabHost.GetAccountAsync(token, gitLab, cancellationToken);
        return null;
    }

    public async Task<string?> GetHeadCommitAsync(string host, string owner, string repo,
        RepositoryAccess? access, string? branch, CancellationToken cancellationToken)
    {
        RepositoryAccess effectiveAccess = access ?? RepositoryAccess.Anonymous;

        if (RepositoryHosts.IsGitHub(host))
            return await gitHubHost.GetHeadCommitAsync(owner, repo, effectiveAccess, branch, cancellationToken);
        if (RepositoryHosts.IsGitLab(host, effectiveAccess.GitLab.Host))
            return await gitLabHost.GetHeadCommitAsync(owner, repo, effectiveAccess, branch, cancellationToken);
        return null;
    }

    public async Task<RepositoryBranchListing?> ListBranchesAsync(string host, string owner, string repo,
        RepositoryAccess? access, CancellationToken cancellationToken)
    {
        RepositoryAccess effectiveAccess = access ?? RepositoryAccess.Anonymous;

        if (RepositoryHosts.IsGitHub(host))
            return await gitHubHost.ListBranchesAsync(owner, repo, effectiveAccess, cancellationToken);
        if (RepositoryHosts.IsGitLab(host, effectiveAccess.GitLab.Host))
            return await gitLabHost.ListBranchesAsync(owner, repo, effectiveAccess, cancellationToken);
        return null;
    }

    public async Task<List<string>?> ListTagsAsync(string host, string owner, string repo,
        RepositoryAccess? access, CancellationToken cancellationToken)
    {
        RepositoryAccess effectiveAccess = access ?? RepositoryAccess.Anonymous;

        if (RepositoryHosts.IsGitHub(host))
            return await gitHubHost.ListTagsAsync(owner, repo, effectiveAccess, cancellationToken);
        if (RepositoryHosts.IsGitLab(host, effectiveAccess.GitLab.Host))
            return await gitLabHost.ListTagsAsync(owner, repo, effectiveAccess, cancellationToken);
        return null;
    }

    public async Task<RepositoryComparison?> CompareAsync(string host, string owner, string repo,
        RepositoryAccess? access, string baseReference, string headReference, CancellationToken cancellationToken)
    {
        RepositoryAccess effectiveAccess = access ?? RepositoryAccess.Anonymous;

        if (RepositoryHosts.IsGitHub(host))
            return await gitHubHost.CompareAsync(owner, repo, effectiveAccess, baseReference, headReference,
                cancellationToken);
        if (RepositoryHosts.IsGitLab(host, effectiveAccess.GitLab.Host))
            return await gitLabHost.CompareAsync(owner, repo, effectiveAccess, baseReference, headReference,
                cancellationToken);
        return null;
    }

    public async Task<RepositoryFileListing> ListFilesAsync(string host, string owner, string repo,
        RepositoryAccess? access, string? commitSha, CancellationToken cancellationToken)
    {
        string reference = string.IsNullOrEmpty(commitSha) ? "HEAD" : commitSha;
        RepositoryAccess effectiveAccess = access ?? RepositoryAccess.Anonymous;

        if (RepositoryHosts.IsGitHub(host))
            return await gitHubHost.ListFilesAsync(owner, repo, reference, effectiveAccess, cancellationToken);
        if (RepositoryHosts.IsGitLab(host, effectiveAccess.GitLab.Host))
            return await gitLabHost.ListFilesAsync(owner, repo, reference, effectiveAccess, cancellationToken);
        return new RepositoryFileListing([], false);
    }

    public string? FileUrl(string host, string owner, string repo, RepositoryAccess? access, string path,
        string reference)
    {
        RepositoryAccess effectiveAccess = access ?? RepositoryAccess.Anonymous;

        if (RepositoryHosts.IsGitHub(host))
            return GitHubRepositoryHost.FileUrl(owner, repo, reference, path);
        if (RepositoryHosts.IsGitLab(host, effectiveAccess.GitLab.Host))
            return GitLabRepositoryHost.FileUrl(effectiveAccess, owner, repo, reference, path);
        return null;
    }

    public async Task<string?> FetchTextAsync(string host, string url, RepositoryAccess? access,
        CancellationToken cancellationToken)
    {
        RepositoryAccess effectiveAccess = access ?? RepositoryAccess.Anonymous;

        if (RepositoryHosts.IsGitHub(host))
            return await gitHubHost.FetchTextAsync(url, effectiveAccess, cancellationToken);
        if (RepositoryHosts.IsGitLab(host, effectiveAccess.GitLab.Host))
            return await gitLabHost.FetchTextAsync(url, effectiveAccess, cancellationToken);
        return null;
    }

    public async Task<string?> FindMergeRequestUrlAsync(string host, string owner, string repo,
        RepositoryAccess access, string sourceBranch, CancellationToken cancellationToken)
    {
        if (RepositoryHosts.IsGitHub(host))
            return await gitHubHost.FindPullRequestUrlAsync(owner, repo, access.Token, sourceBranch, cancellationToken);
        if (RepositoryHosts.IsGitLab(host, access.GitLab.Host))
            return await gitLabHost.FindMergeRequestUrlAsync(owner, repo, access, sourceBranch, cancellationToken);
        return null;
    }

    private static bool IsGitHubPlatform(string platform) =>
        platform.Contains("github", StringComparison.OrdinalIgnoreCase);

    private static bool IsGitLabPlatform(string platform) =>
        platform.Contains("gitlab", StringComparison.OrdinalIgnoreCase);
}
