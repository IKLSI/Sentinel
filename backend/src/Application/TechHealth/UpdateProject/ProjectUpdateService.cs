using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.TechHealth;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.TechHealth.UpdateProject;

public class ProjectUpdateService(
    IProjectRepository projectRepository,
    ICommitScopeFactory commitScopeFactory,
    IAuditLogService auditLog,
    ITenantContext tenant,
    ProjectUpdateValidator validator) : IService
{
    public async Task<Result<ProjectScanFrequencyDto>> ExecuteAsync(Guid projectId, UpdateProjectDto model,
        CancellationToken cancellationToken)
    {
        Result validationResult = await validator.ValidateAsync(model, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<ProjectScanFrequencyDto>.From(validationResult);

        if (tenant.OrganizationId is not Guid organizationId)
            return Result<ProjectScanFrequencyDto>.Unauthorized();

        Project? project = await projectRepository.GetOrDefaultInOrganizationAsync(projectId, organizationId,
            QueryTracking.Tracked, cancellationToken);

        if (project == null)
            return Result<ProjectScanFrequencyDto>.NotFound(ErrorCodes.ProjectNotFound);

        if (!Enum.TryParse(model.ScanFrequency, true, out ScanFrequency scanFrequency))
        {
            return Result<ProjectScanFrequencyDto>.Error(
                ErrorCodes.ProjectInvalidScanFrequency,
                new Dictionary<string, string> { ["values"] = string.Join(", ", Enum.GetNames<ScanFrequency>()) });
        }

        using (ICommitScope commitScope = commitScopeFactory.Begin())
        {
            project.ScanFrequency = scanFrequency;
            await commitScope.CommitAsync(cancellationToken);
        }

        await auditLog.LogAsync(
            AuditAction.ProjectUpdated,
            entityType: AuditEntityTypes.Project,
            organizationId: organizationId,
            userId: tenant.UserId,
            entityId: projectId,
            jti: tenant.Jti);

        return new ProjectScanFrequencyDto { ScanFrequency = project.ScanFrequency.ToString() };
    }
}
