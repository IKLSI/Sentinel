using Sentinel.Application.Abstractions;
using Sentinel.Application.Audit;
using Sentinel.Application.Common;
using Sentinel.Application.TechHealth.CreateProject;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Git;
using Sentinel.Domain.Realtime;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.TechHealth.ImportProjects;

public class ProjectImportService(
    IProjectRepository projectRepository,
    IOrganizationRepository organizationRepository,
    ICommitScopeFactory commitScopeFactory,
    IAuditLogService auditLog,
    IRealtimeNotifier realtimeNotifier,
    ITenantContext tenant,
    ProjectImportValidator validator) : IService
{
    public async Task<Result<List<ProjectDto>>> ExecuteAsync(ImportProjectsDto model,
        CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<List<ProjectDto>>.Unauthorized();

        Organization? organization = await organizationRepository.GetOrDefaultAsync(organizationId,
            QueryTracking.NoTracking, cancellationToken);

        if (organization == null)
            return Result<List<ProjectDto>>.NotFound();

        Result validationResult = await validator.ValidateAsync(model, organization.ToGitLabInstance().Host,
            cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<List<ProjectDto>>.From(validationResult);

        List<Project> projects = model.Projects
            .Select(project => ProjectFactory.Create(organizationId, project))
            .ToList();

        using (ICommitScope commitScope = commitScopeFactory.Begin())
        {
            await projectRepository.AddRangeAsync(projects, cancellationToken);
            await commitScope.CommitAsync(cancellationToken);
        }

        await realtimeNotifier.NotifyOrganizationAsync(organizationId,
            new RealtimeEvent(RealtimeResources.Projects));

        foreach (Project project in projects)
        {
            await auditLog.LogAsync(
                AuditAction.ProjectCreated,
                entityType: AuditEntityTypes.Project,
                organizationId: organizationId,
                userId: tenant.UserId,
                entityId: project.Id,
                jti: tenant.Jti);
        }

        return projects.Select(ProjectMapper.ToDto).ToList();
    }
}
