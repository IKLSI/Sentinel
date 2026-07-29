using Sentinel.Application.Abstractions;
using Sentinel.Application.Billing;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.TechHealth;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.TechHealth.CreateProject;

public class ProjectCreateService(
    IProjectRepository projectRepository,
    ICommitScopeFactory commitScopeFactory,
    TechHealthService techHealthService,
    QuotaGuard quotaGuard,
    IAuditLogService auditLog,
    ITenantContext tenant,
    ProjectCreateValidator validator) : IService
{
    public async Task<Result<ProjectDto>> ExecuteAsync(CreateProjectDto model, CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<ProjectDto>.Unauthorized();

        Result validationResult = await validator.ValidateAsync(model, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<ProjectDto>.From(validationResult);

        Result quotaResult = await quotaGuard.EnsureCanAddProjectAsync(organizationId, cancellationToken);

        if (!quotaResult.IsSuccess)
            return Result<ProjectDto>.From(quotaResult);

        if (!Enum.TryParse(model.RepositoryType, true, out RepositoryType repositoryType))
            repositoryType = RepositoryType.GitHub;

        if (!Enum.TryParse(model.ScanFrequency, true, out ScanFrequency scanFrequency))
            scanFrequency = ScanFrequency.Weekly;

        Project project = new Project
        {
            OrganizationId = organizationId,
            Name = model.Name,
            RepositoryUrl = model.RepositoryUrl,
            RepositoryType = repositoryType,
            ScanFrequency = scanFrequency
        };

        using (ICommitScope commitScope = commitScopeFactory.Begin())
        {
            await projectRepository.AddAsync(project, cancellationToken);
            await commitScope.CommitAsync(cancellationToken);
        }

        await auditLog.LogAsync(
            AuditAction.ProjectCreated,
            entityType: AuditEntityTypes.Project,
            organizationId: organizationId,
            userId: tenant.UserId,
            entityId: project.Id,
            jti: tenant.Jti);

        ProjectDto? created = await techHealthService.GetProjectWithDetailsAsync(project.Id);

        return Result<ProjectDto>.Success(created!);
    }
}
