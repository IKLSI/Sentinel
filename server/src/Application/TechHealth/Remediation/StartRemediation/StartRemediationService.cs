using Sentinel.Application.Abstractions;
using Sentinel.Application.Audit;
using Sentinel.Application.Common;
using Sentinel.Application.Jobs;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Realtime;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.TechHealth.Remediation.StartRemediation;

public class StartRemediationService(
    IProjectRepository projectRepository,
    IOrganizationRepository organizationRepository,
    IVulnerabilitySuppressionRepository suppressionRepository,
    IVulnerabilityRemediationRepository remediationRepository,
    IRemediationRunner runner,
    IJobScheduler jobs,
    ICommitScopeFactory commitScopeFactory,
    IAuditLogService auditLog,
    IRealtimeNotifier realtimeNotifier,
    ITenantContext tenant) : IService
{
    public async Task<Result<RemediationDto>> ExecuteAsync(Guid projectId, CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<RemediationDto>.Unauthorized();

        if (!runner.IsConfigured)
            return Result<RemediationDto>.Error(ErrorCodes.RemediationUnavailable);

        Project? project = await projectRepository.GetOrDefaultInOrganizationWithHealthDetailsAsync(projectId,
            organizationId, cancellationToken);

        if (project == null)
            return Result<RemediationDto>.NotFound(ErrorCodes.ProjectNotFound);

        IReadOnlyList<VulnerabilitySuppression> suppressions =
            await suppressionRepository.ListActiveByProjectAsync(projectId, DateTime.UtcNow, cancellationToken);

        if (RemediationRules.RemediableFindings(project.Dependencies,
                suppressions.Select(suppression => suppression.FindingKey).ToHashSet()).Count == 0)
            return Result<RemediationDto>.Error(ErrorCodes.RemediationNotEligible);

        Organization? organization = await organizationRepository.GetOrDefaultAsync(organizationId,
            QueryTracking.NoTracking, cancellationToken);

        if (string.IsNullOrEmpty(organization?.ProtectedTokenFor(project.RepositoryType)))
            return Result<RemediationDto>.Error(ErrorCodes.RemediationTokenMissing);

        VulnerabilityRemediation? remediation = await remediationRepository.GetOrDefaultByProjectAsync(projectId,
            QueryTracking.Tracked, cancellationToken);

        if (remediation is { IsInProgress: true } && !RemediationRules.IsStale(remediation, DateTime.UtcNow))
            return Result<RemediationDto>.Conflict(ErrorCodes.RemediationInProgress);

        using (ICommitScope commitScope = commitScopeFactory.Begin())
        {
            if (remediation == null)
            {
                remediation = new VulnerabilityRemediation
                {
                    OrganizationId = organizationId,
                    ProjectId = projectId
                };

                await remediationRepository.AddAsync(remediation, cancellationToken);
            }

            remediation.BranchName = RemediationRules.BranchName;
            remediation.Status = RemediationStatus.Queued;
            remediation.RunnerJobId = null;
            remediation.MergeRequestUrl = null;
            remediation.FailureCode = null;
            remediation.ConfigTicketHash = null;
            remediation.ConfigTicketExpiresAt = null;
            remediation.CompletionTicketHash = null;
            remediation.RequestedById = tenant.UserId;
            remediation.CreatedAt = DateTime.UtcNow;
            remediation.UpdatedAt = DateTime.UtcNow;

            await commitScope.CommitAsync(cancellationToken);
        }

        Guid remediationId = remediation.Id;
        jobs.Enqueue<RemediationRunJob>(JobQueues.Default, job => job.StartAsync(remediationId, CancellationToken.None));

        await realtimeNotifier.NotifyOrganizationAsync(organizationId,
            new RealtimeEvent(RealtimeResources.Project, projectId));

        await auditLog.LogAsync(
            AuditAction.VulnerabilityRemediationRequested,
            entityType: AuditEntityTypes.Project,
            organizationId: organizationId,
            userId: tenant.UserId,
            entityId: projectId,
            jti: tenant.Jti);

        return RemediationMapper.ToDto(remediation);
    }
}
