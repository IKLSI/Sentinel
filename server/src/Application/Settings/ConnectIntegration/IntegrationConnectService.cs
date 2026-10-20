using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
using Sentinel.Application.Security;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Git;
using Sentinel.Domain.Realtime;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Settings.ConnectIntegration;

public class IntegrationConnectService(
    IOrganizationRepository organizationRepository,
    ICommitScopeFactory commitScopeFactory,
    IRepositoryHostClient repositoryHostClient,
    TokenProtector tokenProtector,
    IAuditLogService auditLog,
    IRealtimeNotifier realtimeNotifier,
    ITenantContext tenant,
    IntegrationConnectValidator validator) : IService
{
    public async Task<Result> ExecuteAsync(ConnectIntegrationDto model, RepositoryType platform,
        CancellationToken cancellationToken)
    {
        Result validationResult = await validator.ValidateAsync(model, platform, cancellationToken);

        if (!validationResult.IsSuccess)
            return validationResult;

        if (tenant.OrganizationId is not Guid organizationId)
            return Result.Unauthorized();

        if (string.IsNullOrWhiteSpace(model.Token))
            return Result.Error(ErrorCodes.SettingsTokenRequired);

        Organization? organization = await organizationRepository.GetOrDefaultAsync(organizationId,
            QueryTracking.Tracked, cancellationToken);

        if (organization == null)
            return Result.NotFound();

        GitLabInstance gitLab = platform == RepositoryType.GitLab
            ? GitLabInstanceOf(model)
            : organization.ToGitLabInstance();

        (string Id, string Login)? account = await repositoryHostClient
            .GetAuthenticatedAccountAsync(model.Token, platform.ToString().ToLower(), gitLab, cancellationToken);

        if (account == null)
            return Result.Error(InvalidTokenCode(platform));

        using (ICommitScope commitScope = commitScopeFactory.Begin())
        {
            string protectedToken = tokenProtector.Protect(model.Token);

            if (platform == RepositoryType.GitHub)
                organization.GithubToken = protectedToken;
            else
            {
                organization.GitlabToken = protectedToken;
                organization.GitlabBaseUrl = IsPublicGitLab(gitLab) ? null : gitLab.BaseUrl;
            }

            organization.UpdatedAt = DateTime.UtcNow;

            await commitScope.CommitAsync(cancellationToken);
        }

        await realtimeNotifier.NotifyOrganizationAsync(organizationId,
            new RealtimeEvent(RealtimeResources.Integrations));

        await auditLog.LogAsync(
            SavedAction(platform),
            entityType: AuditEntityTypes.Organization,
            organizationId: organizationId,
            userId: tenant.UserId,
            entityId: organizationId,
            jti: tenant.Jti);

        return Result.NoContent();
    }

    private static GitLabInstance GitLabInstanceOf(ConnectIntegrationDto model)
    {
        string baseUrl = string.IsNullOrWhiteSpace(model.BaseUrl)
            ? RepositoryHosts.PublicGitLabBaseUrl
            : new Uri(model.BaseUrl.Trim()).GetLeftPart(UriPartial.Authority);

        return new GitLabInstance(baseUrl);
    }

    private static bool IsPublicGitLab(GitLabInstance gitLab) =>
        string.Equals(gitLab.BaseUrl, RepositoryHosts.PublicGitLabBaseUrl, StringComparison.OrdinalIgnoreCase);

    private static string InvalidTokenCode(RepositoryType platform) => platform == RepositoryType.GitHub
        ? ErrorCodes.SettingsInvalidGithubToken
        : ErrorCodes.SettingsInvalidGitlabToken;

    private static AuditAction SavedAction(RepositoryType platform) => platform == RepositoryType.GitHub
        ? AuditAction.GithubIntegrationSaved
        : AuditAction.GitlabIntegrationSaved;
}
