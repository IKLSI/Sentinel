using Hangfire;
using Microsoft.Extensions.Logging;
using Sentinel.Application.Common;
using Sentinel.Application.Security;
using Sentinel.Application.TechHealth;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Git;
using Sentinel.Domain.Realtime;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.Jobs;

public class RemediationRunJob(
    IVulnerabilityRemediationRepository remediationRepository,
    IOrganizationRepository organizationRepository,
    IRemediationRunner runner,
    IRepositoryHostClient repositoryHostClient,
    TokenProtector tokenProtector,
    ICommitScopeFactory commitScopeFactory,
    IJobScheduler jobs,
    IRealtimeNotifier realtimeNotifier,
    ISystemScope systemScope,
    ILogger<RemediationRunJob> logger)
{
    public static readonly TimeSpan ConfigTicketLifetime = TimeSpan.FromMinutes(15);
    private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(30);
    private static readonly TimeSpan RunLookupMargin = TimeSpan.FromMinutes(1);

    [AutomaticRetry(Attempts = 0)]
    public async Task StartAsync(Guid remediationId, CancellationToken cancellationToken)
    {
        using IDisposable elevation = systemScope.Enter();

        VulnerabilityRemediation? remediation = await remediationRepository.GetOrDefaultAsync(remediationId,
            QueryTracking.Tracked, cancellationToken);

        if (remediation is not { Status: RemediationStatus.Queued }) return;

        string configTicket = SecureToken.Generate();

        using (ICommitScope commitScope = commitScopeFactory.Begin())
        {
            remediation.ConfigTicketHash = SecureToken.Hash(configTicket);
            remediation.ConfigTicketExpiresAt = DateTime.UtcNow + ConfigTicketLifetime;
            remediation.UpdatedAt = DateTime.UtcNow;

            await commitScope.CommitAsync(cancellationToken);
        }

        string? runnerJobId = await runner.StartAsync(remediationId, configTicket, cancellationToken);

        using (ICommitScope commitScope = commitScopeFactory.Begin())
        {
            if (runnerJobId == null)
                MarkFailed(remediation, ErrorCodes.RemediationStartFailed);
            else
            {
                remediation.RunnerJobId = runnerJobId;
                remediation.Status = RemediationStatus.Running;
                remediation.UpdatedAt = DateTime.UtcNow;
            }

            await commitScope.CommitAsync(cancellationToken);
        }

        if (runnerJobId != null) ScheduleMonitor(remediationId);

        await NotifyAsync(remediation);
    }

    public async Task MonitorAsync(Guid remediationId, CancellationToken cancellationToken)
    {
        using IDisposable elevation = systemScope.Enter();

        VulnerabilityRemediation? remediation = await remediationRepository.GetOrDefaultWithProjectAsync(
            remediationId, QueryTracking.Tracked, cancellationToken);

        if (remediation is not { Status: RemediationStatus.Running, RunnerJobId: string runnerJobId }) return;

        RemediationRunState state = await runner.GetStateAsync(runnerJobId,
            remediation.CreatedAt - RunLookupMargin, cancellationToken);

        if (state is RemediationRunState.Pending or RemediationRunState.Running or RemediationRunState.Unknown
            && DateTime.UtcNow - remediation.CreatedAt < RemediationRules.MaxRunDuration)
        {
            ScheduleMonitor(remediationId);
            return;
        }

        string? mergeRequestUrl = state is RemediationRunState.Succeeded or RemediationRunState.Failed
            ? await FindMergeRequestUrlAsync(remediation, cancellationToken)
            : null;

        using (ICommitScope commitScope = commitScopeFactory.Begin())
        {
            if (mergeRequestUrl != null)
            {
                remediation.Status = RemediationStatus.Opened;
                remediation.MergeRequestUrl = mergeRequestUrl;
                remediation.FailureCode = null;
                remediation.UpdatedAt = DateTime.UtcNow;
            }
            else
                MarkFailed(remediation, FailureCodeOf(state));

            await commitScope.CommitAsync(cancellationToken);
        }

        await NotifyAsync(remediation);
    }

    private async Task<string?> FindMergeRequestUrlAsync(VulnerabilityRemediation remediation,
        CancellationToken cancellationToken)
    {
        if (!RepositoryLocation.TryParse(remediation.Project.RepositoryUrl, out RepositoryLocation location))
            return null;

        Organization? organization = await organizationRepository.GetOrDefaultAsync(remediation.OrganizationId,
            QueryTracking.NoTracking, cancellationToken);

        RepositoryAccess access = RepositoryAccessFactory.For(remediation.Project, organization, tokenProtector);

        string? url = await repositoryHostClient.FindMergeRequestUrlAsync(location.Host, location.Owner,
            location.Repository, access, remediation.BranchName, cancellationToken);

        if (url == null)
            logger.LogWarning("Remediation {RemediationId} finished without merge request on {Branch}",
                remediation.Id, remediation.BranchName);

        return url;
    }

    private static string FailureCodeOf(RemediationRunState state) => state switch
    {
        RemediationRunState.Succeeded => ErrorCodes.RemediationNoMergeRequest,
        RemediationRunState.Failed => ErrorCodes.RemediationRunFailed,
        _ => ErrorCodes.RemediationTimedOut
    };

    private static void MarkFailed(VulnerabilityRemediation remediation, string failureCode)
    {
        remediation.Status = RemediationStatus.Failed;
        remediation.FailureCode = failureCode;
        remediation.ConfigTicketHash = null;
        remediation.ConfigTicketExpiresAt = null;
        remediation.UpdatedAt = DateTime.UtcNow;
    }

    private void ScheduleMonitor(Guid remediationId) =>
        jobs.Schedule<RemediationRunJob>(JobQueues.Default,
            job => job.MonitorAsync(remediationId, CancellationToken.None), PollInterval);

    private Task NotifyAsync(VulnerabilityRemediation remediation) =>
        realtimeNotifier.NotifyOrganizationAsync(remediation.OrganizationId,
            new RealtimeEvent(RealtimeResources.Project, remediation.ProjectId));
}
