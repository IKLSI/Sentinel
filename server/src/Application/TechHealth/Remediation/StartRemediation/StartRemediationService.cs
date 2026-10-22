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
    IVulnerabilityRemediationRepository remediationRepository,
    IRemediationRunner runner,
    IJobScheduler jobs,
    ICommitScopeFactory commitScopeFactory,
    IAuditLogService auditLog,
    IRealtimeNotifier realtimeNotifier,
    ITenantContext tenant,
    StartRemediationValidator validator) : IService
{
    public async Task<Result<RemediationDto>> ExecuteAsync(Guid projectId, StartRemediationDto model,
        CancellationToken cancellationToken)
    {
        Result validationResult = await validator.ValidateAsync(model, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<RemediationDto>.From(validationResult);

        if (tenant.OrganizationId is not Guid organizationId)
            return Result<RemediationDto>.Unauthorized();

        if (!runner.IsConfigured)
            return Result<RemediationDto>.Error(ErrorCodes.RemediationUnavailable);

        string findingKey = model.FindingKey.Trim().ToLowerInvariant();

        Project? project = await projectRepository.GetOrDefaultInOrganizationForFindingAsync(projectId,
            organizationId, FindingKind.Vulnerability, findingKey, cancellationToken);

        if (project == null)
            return Result<RemediationDto>.NotFound(ErrorCodes.ProjectNotFound);

        (Dependency? dependency, Vulnerability? vulnerability) = FindingOf(project, findingKey);

        if (dependency == null || vulnerability == null)
            return Result<RemediationDto>.NotFound(ErrorCodes.VulnerabilityNotFound);

        if (!RemediationRules.IsEligible(dependency, vulnerability))
            return Result<RemediationDto>.Error(ErrorCodes.RemediationNotEligible);

        Organization? organization = await organizationRepository.GetOrDefaultAsync(organizationId,
            QueryTracking.NoTracking, cancellationToken);

        if (string.IsNullOrEmpty(organization?.ProtectedTokenFor(project.RepositoryType)))
            return Result<RemediationDto>.Error(ErrorCodes.RemediationTokenMissing);

        VulnerabilityRemediation? remediation = await remediationRepository.GetOrDefaultByFindingKeyAsync(projectId,
            findingKey, QueryTracking.Tracked, cancellationToken);

        if (remediation is { IsInProgress: true } && !RemediationRules.IsStale(remediation, DateTime.UtcNow))
            return Result<RemediationDto>.Conflict(ErrorCodes.RemediationInProgress);

        using (ICommitScope commitScope = commitScopeFactory.Begin())
        {
            if (remediation == null)
            {
                remediation = new VulnerabilityRemediation
                {
                    OrganizationId = organizationId,
                    ProjectId = projectId,
                    FindingKey = findingKey
                };

                await remediationRepository.AddAsync(remediation, cancellationToken);
            }

            string targetVersion = vulnerability.FixedVersion!;

            remediation.Ecosystem = dependency.Ecosystem;
            remediation.PackageName = dependency.Name;
            remediation.TargetVersion = targetVersion;
            remediation.BranchName = RemediationRules.BranchNameFor(dependency.Name, targetVersion);
            remediation.Status = RemediationStatus.Queued;
            remediation.RunnerJobId = null;
            remediation.MergeRequestUrl = null;
            remediation.FailureCode = null;
            remediation.ConfigTicketHash = null;
            remediation.ConfigTicketExpiresAt = null;
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

    private static (Dependency? Dependency, Vulnerability? Vulnerability) FindingOf(Project project,
        string findingKey) =>
        project.Dependencies
            .SelectMany(dependency => dependency.Vulnerabilities
                .Select(vulnerability => ((Dependency?)dependency, (Vulnerability?)vulnerability)))
            .FirstOrDefault(pair => FindingKeys.ForVulnerability(pair.Item1!.Ecosystem, pair.Item2!.PackageName,
                pair.Item2.CveId) == findingKey);
}
