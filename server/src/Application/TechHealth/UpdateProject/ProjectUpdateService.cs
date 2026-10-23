using Sentinel.Domain.TechHealth;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Realtime;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.TechHealth.UpdateProject;

public class ProjectUpdateService(
    IProjectRepository projectRepository,
    ICommitScopeFactory commitScopeFactory,
    IAuditLogService auditLog,
    IRealtimeNotifier realtimeNotifier,
    ITenantContext tenant,
    ProjectUpdateValidator validator) : IService
{
    public async Task<Result<ProjectScanSettingsDto>> ExecuteAsync(Guid projectId, UpdateProjectDto model,
        CancellationToken cancellationToken)
    {
        Result validationResult = await validator.ValidateAsync(model, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<ProjectScanSettingsDto>.From(validationResult);

        if (tenant.OrganizationId is not Guid organizationId)
            return Result<ProjectScanSettingsDto>.Unauthorized();

        Project? project = await projectRepository.GetOrDefaultInOrganizationAsync(projectId, organizationId,
            QueryTracking.Tracked, cancellationToken);

        if (project == null)
            return Result<ProjectScanSettingsDto>.NotFound(ErrorCodes.ProjectNotFound);

        if (!EnumValue.TryParse(model.ScanFrequency, out ScanFrequency scanFrequency))
        {
            return Result<ProjectScanSettingsDto>.Error(
                ErrorCodes.ProjectInvalidScanFrequency,
                new Dictionary<string, string> { ["values"] = string.Join(", ", Enum.GetNames<ScanFrequency>()) });
        }

        using (ICommitScope commitScope = commitScopeFactory.Begin())
        {
            string? branch = string.IsNullOrWhiteSpace(model.Branch) ? null : model.Branch.Trim();
            string? rootPath = RepositoryScanPaths.NormalizeRootPath(model.RootPath);

            if (branch != project.Branch || rootPath != project.RootPath)
                project.LastScannedCommitSha = null;

            project.ScanFrequency = scanFrequency;
            project.Branch = branch;
            project.RootPath = rootPath;
            await commitScope.CommitAsync(cancellationToken);
        }

        await realtimeNotifier.NotifyOrganizationAsync(organizationId,
            new RealtimeEvent(RealtimeResources.Project, projectId));

        await auditLog.LogAsync(
            AuditAction.ProjectUpdated,
            entityType: AuditEntityTypes.Project,
            organizationId: organizationId,
            userId: tenant.UserId,
            entityId: projectId,
            jti: tenant.Jti);

        return new ProjectScanSettingsDto
        {
            ScanFrequency = project.ScanFrequency.ToString(),
            Branch = project.Branch,
            RootPath = project.RootPath
        };
    }
}
