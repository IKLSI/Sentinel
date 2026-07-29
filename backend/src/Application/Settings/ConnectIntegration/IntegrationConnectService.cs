using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
using Sentinel.Application.Exports;
using Sentinel.Application.Notifications;
using Sentinel.Application.Security;
using Sentinel.Application.TechHealth;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Settings;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Settings.ConnectIntegration;

public class IntegrationConnectService(
    IOrganizationRepository organizationRepository,
    IUnitOfWorkManager unitOfWorkManager,
    IRepositoryHostClient repositoryHostClient,
    TokenProtector tokenProtector,
    IAuditLogService auditLog,
    ITenantContext tenant,
    IntegrationConnectValidator validator) : IService
{

    public async Task<Result> ExecuteAsync(ConnectIntegrationDto model, RepositoryType platform,
        CancellationToken cancellationToken)
    {
        Result validationResult = await validator.ValidateAsync(model, cancellationToken);

        if (!validationResult.IsSuccess)
            return validationResult;

        if (tenant.OrganizationId is not Guid organizationId)
            return Result.Unauthorized();

        if (string.IsNullOrWhiteSpace(model.Token))
            return Result.Error(ErrorCodes.SettingsTokenRequired);

        Organization? organization = await organizationRepository.GetOrDefaultAsync(organizationId,
            new SingleEntityQueryOptions<Organization>(), cancellationToken);

        if (organization == null)
            return Result.NotFound();

        (string Id, string Login)? account = await repositoryHostClient
            .GetAuthenticatedAccountAsync(model.Token, platform.ToString().ToLower());

        if (account == null)
            return Result.Error(InvalidTokenCode(platform));

        using (IUnitOfWork unitOfWork = unitOfWorkManager.NewUnitOfWork())
        {
            string protectedToken = tokenProtector.Protect(model.Token);

            if (platform == RepositoryType.GitHub)
                organization.GithubToken = protectedToken;
            else
                organization.GitlabToken = protectedToken;

            organization.UpdatedAt = DateTime.UtcNow;

            await unitOfWork.CommitAsync(cancellationToken);
        }

        await auditLog.LogAsync(
            SavedAction(platform),
            entityType: AuditEntityTypes.Organization,
            organizationId: organizationId,
            userId: tenant.UserId,
            entityId: organizationId,
            jti: tenant.Jti);

        return Result.NoContent();
    }

    private static string InvalidTokenCode(RepositoryType platform) => platform == RepositoryType.GitHub
        ? ErrorCodes.SettingsInvalidGithubToken
        : ErrorCodes.SettingsInvalidGitlabToken;

    private static AuditAction SavedAction(RepositoryType platform) => platform == RepositoryType.GitHub
        ? AuditAction.GithubIntegrationSaved
        : AuditAction.GitlabIntegrationSaved;
}
