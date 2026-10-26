using System.Collections.Concurrent;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Realtime;

namespace Sentinel.Application.TechHealth.Scan;

public enum ScanStage
{
    Queued,
    Repository,
    Manifests,
    Registries,
    Advisories,
    Scoring
}

public sealed record ScanProgressEntry(Guid ProjectId, Guid OrganizationId, ScanStage Stage, DateTime UpdatedAt);

public sealed class ScanProgressTracker(IRealtimeNotifier realtimeNotifier)
{
    private static readonly TimeSpan EntryExpiry = TimeSpan.FromHours(3);

    private readonly ConcurrentDictionary<Guid, ScanProgressEntry> _entries = new();

    public void Report(Guid projectId, Guid organizationId, ScanStage stage)
    {
        _entries[projectId] = new ScanProgressEntry(projectId, organizationId, stage, DateTime.UtcNow);
        Notify(organizationId, projectId);
    }

    public IProgress<ScanStage> For(Guid projectId, Guid organizationId) =>
        new StageReporter(this, projectId, organizationId);

    public void Complete(Guid projectId)
    {
        if (_entries.TryRemove(projectId, out ScanProgressEntry? entry))
            Notify(entry.OrganizationId, projectId);
    }

    public IReadOnlyList<ScanProgressEntry> ListForOrganization(Guid organizationId)
    {
        DateTime threshold = DateTime.UtcNow - EntryExpiry;

        return _entries.Values
            .Where(entry => entry.OrganizationId == organizationId && entry.UpdatedAt > threshold)
            .OrderBy(entry => entry.UpdatedAt)
            .ToList();
    }

    private void Notify(Guid organizationId, Guid projectId) =>
        _ = realtimeNotifier.NotifyOrganizationAsync(organizationId,
            new RealtimeEvent(RealtimeResources.ScanProgress, projectId));

    private sealed class StageReporter(ScanProgressTracker tracker, Guid projectId, Guid organizationId)
        : IProgress<ScanStage>
    {
        public void Report(ScanStage value) => tracker.Report(projectId, organizationId, value);
    }
}
