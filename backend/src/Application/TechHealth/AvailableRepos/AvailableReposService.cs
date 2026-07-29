using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Security;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.DTOs.TechHealth;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.TechHealth.AvailableRepos;

public class AvailableReposService(
    IOrganizationRepository organizationRepository,
    IProjectRepository projectRepository,
    IRepositoryHostClient repositoryHostClient,
    TokenProtector tokenProtector,
    ITenantContext tenant) : IService
{
    public async Task<Result<AvailableReposResponse>> ExecuteAsync(CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<AvailableReposResponse>.Unauthorized();

        Organization? organization = await organizationRepository.GetOrDefaultAsync(organizationId,
            QueryTracking.NoTracking, cancellationToken);

        if (organization == null)
            return Result<AvailableReposResponse>.NotFound();

        IReadOnlyList<string?> existingUrls = await projectRepository
            .ListRepositoryUrlsAsync(organizationId, cancellationToken);

        List<AvailableRepoDto> repos = [];
        bool fetchFailed = false;
        int? fetchFailedStatusCode = null;

        (string? Token, RepositoryType Platform)[] integrations =
        [
            (organization.GithubToken, RepositoryType.GitHub),
            (organization.GitlabToken, RepositoryType.GitLab),
        ];

        foreach ((string? protectedToken, RepositoryType platform) in integrations)
        {
            if (string.IsNullOrEmpty(protectedToken)) continue;

            string? token = tokenProtector.Unprotect(protectedToken);

            if (string.IsNullOrEmpty(token))
            {
                fetchFailed = true;
                continue;
            }

            (bool success, int? statusCode, List<(string Name, string Url)> platformRepos) =
                await repositoryHostClient.ListUserRepositoriesAsync(token, platform.ToString().ToLower());

            if (!success)
            {
                fetchFailed = true;
                fetchFailedStatusCode ??= statusCode;
            }

            foreach ((string name, string url) in platformRepos)
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
            FetchFailedStatusCode = fetchFailedStatusCode
        };
    }
}
