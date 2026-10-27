using Sentinel.Application.Abstractions;
using Sentinel.Application.Audit;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Git;
using Sentinel.Domain.Realtime;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.Projects.Create;

public class ProjectCreateService(
    IProjectRepository projectRepository,
    IOrganizationRepository organizationRepository,
    ICommitScopeFactory commitScopeFactory,
    IAuditLogService auditLog,
    IRealtimeNotifier realtimeNotifier,
    ITenantContext tenant,
    ProjectCreateValidator validator) : IService
{
    public async Task<Result<ProjectDto>> ExecuteAsync(CreateProjectDto model, CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<ProjectDto>.Unauthorized();

        Organization? organization = await organizationRepository.GetOrDefaultAsync(organizationId,
            QueryTracking.NoTracking, cancellationToken);

        if (organization == null)
            return Result<ProjectDto>.NotFound();

        Result validationResult = await validator.ValidateAsync(model, organization.ToGitLabInstance().Host,
            cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<ProjectDto>.From(validationResult);

        Project project = ProjectFactory.Create(organizationId, model);

        using (ICommitScope commitScope = commitScopeFactory.Begin())
        {
            await projectRepository.AddAsync(project, cancellationToken);
            await commitScope.CommitAsync(cancellationToken);
        }

        await realtimeNotifier.NotifyOrganizationAsync(organizationId,
            new RealtimeEvent(RealtimeResources.Projects));

        await auditLog.LogAsync(
            AuditAction.ProjectCreated,
            entityType: AuditEntityTypes.Project,
            organizationId: organizationId,
            userId: tenant.UserId,
            entityId: project.Id,
            jti: tenant.Jti);

        return Result<ProjectDto>.Success(ProjectMapper.ToDto(project));
    }
}
