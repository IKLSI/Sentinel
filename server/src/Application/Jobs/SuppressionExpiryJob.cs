using Sentinel.Application.TechHealth.Suppressions;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Realtime;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Jobs;

public class SuppressionExpiryJob(
    IVulnerabilitySuppressionRepository suppressionRepository,
    ProjectHealthRecalculator healthRecalculator,
    IRealtimeNotifier realtimeNotifier,
    ISystemScope systemScope,
    IDatabaseConnectionHolder connectionHolder)
{
    private static readonly TimeSpan LookbackWindow = TimeSpan.FromHours(2);

    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        using IDisposable elevation = systemScope.Enter();
        await using IAsyncDisposable connection = await connectionHolder.HoldOpenAsync(cancellationToken);

        DateTime now = DateTime.UtcNow;

        IReadOnlyList<(Guid OrganizationId, Guid ProjectId)> projects = await suppressionRepository
            .ListProjectsWithSuppressionExpiredBetweenAsync(now - LookbackWindow, now, cancellationToken);

        foreach ((Guid organizationId, Guid projectId) in projects)
        {
            await healthRecalculator.RecalculateAsync(organizationId, projectId, cancellationToken);

            await realtimeNotifier.NotifyOrganizationAsync(organizationId,
                new RealtimeEvent(RealtimeResources.Project, projectId));
        }
    }
}
