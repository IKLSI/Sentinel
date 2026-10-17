using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Caching.Memory;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Security;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Git;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.TechHealth.AvailableRepos;

public class AvailableReposService(
    IOrganizationRepository organizationRepository,
    IProjectRepository projectRepository,
    IRepositoryHostClient repositoryHostClient,
    TokenProtector tokenProtector,
    IMemoryCache cache,
    ITenantContext tenant) : IService
{
    private sealed record PlatformListing(RepositoryType Platform, RepositoryListing? Listing);

    public async Task<Result<AvailableReposResponse>> ExecuteAsync(CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<AvailableReposResponse>.Unauthorized();

        Organization? organization = await organizationRepository.GetOrDefaultAsync(organizationId,
            QueryTracking.NoTracking, cancellationToken);

        if (organization == null)
            return Result<AvailableReposResponse>.NotFound();

        IReadOnlyList<string?> existingUrlList = await projectRepository
            .ListRepositoryUrlsAsync(organizationId, cancellationToken);

        HashSet<string?> existingUrls = existingUrlList.ToHashSet();

        List<AvailableRepoDto> repos = [];
        bool fetchFailed = false;
        bool listingTruncated = false;
        int? fetchFailedStatusCode = null;

        (string? Token, RepositoryType Platform)[] integrations =
        [
            (organization.GithubToken, RepositoryType.GitHub),
            (organization.GitlabToken, RepositoryType.GitLab),
        ];

        PlatformListing[] listings = await Task.WhenAll(integrations
            .Where(integration => !string.IsNullOrEmpty(integration.Token))
            .Select(integration => ListAsync(organizationId, integration.Token!, integration.Platform,
                organization.ToGitLabInstance())));

        foreach ((RepositoryType platform, RepositoryListing? listing) in listings)
        {
            if (listing == null)
            {
                fetchFailed = true;
                continue;
            }

            if (!listing.Success)
            {
                fetchFailed = true;
                fetchFailedStatusCode ??= listing.StatusCode;
            }

            listingTruncated |= listing.Truncated;

            foreach ((string name, string url) in listing.Repos)
            {
                if (!existingUrls.Contains(url))
                    repos.Add(new AvailableRepoDto { Name = name, Url = url, Platform = platform.ToString() });
            }
        }

        return new AvailableReposResponse
        {
            Repos = repos,
            HasToken = !string.IsNullOrEmpty(organization.GithubToken) || !string.IsNullOrEmpty(organization.GitlabToken),
            FetchFailed = fetchFailed,
            FetchFailedStatusCode = fetchFailedStatusCode,
            Truncated = listingTruncated
        };
    }

    private async Task<PlatformListing> ListAsync(Guid organizationId, string protectedToken, RepositoryType platform,
        GitLabInstance gitLab)
    {
        string cacheKey = CacheKeys.AvailableRepos(organizationId, platform, Fingerprint(protectedToken + gitLab.BaseUrl));

        if (cache.TryGetValue(cacheKey, out RepositoryListing? cached) && cached != null)
            return new PlatformListing(platform, cached);

        string? token = tokenProtector.Unprotect(protectedToken);

        if (string.IsNullOrEmpty(token))
            return new PlatformListing(platform, null);

        RepositoryListing listing =
            await repositoryHostClient.ListUserRepositoriesAsync(token, platform.ToString().ToLower(), gitLab);

        if (listing.Success)
        {
            cache.Set(cacheKey, listing, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = CacheKeys.AvailableReposTtl,
                Size = Math.Max(1, listing.Repos.Count)
            });
        }

        return new PlatformListing(platform, listing);
    }

    private static string Fingerprint(string protectedToken) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(protectedToken)));
}
