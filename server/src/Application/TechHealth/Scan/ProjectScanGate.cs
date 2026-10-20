using System.Collections.Concurrent;

namespace Sentinel.Application.TechHealth.Scan;

public sealed class ProjectScanGate
{
    private static readonly TimeSpan QueueExpiry = TimeSpan.FromHours(3);

    private readonly ConcurrentDictionary<Guid, DateTime> _queued = new();
    private readonly ConcurrentDictionary<Guid, byte> _running = new();

    public bool TryQueue(Guid projectId)
    {
        if (_running.ContainsKey(projectId)) return false;

        DateTime now = DateTime.UtcNow;

        if (_queued.TryAdd(projectId, now)) return true;

        if (!_queued.TryGetValue(projectId, out DateTime queuedAt) || now - queuedAt < QueueExpiry)
            return false;

        return _queued.TryUpdate(projectId, now, queuedAt);
    }

    public bool TryStart(Guid projectId)
    {
        _queued.TryRemove(projectId, out _);

        return _running.TryAdd(projectId, 0);
    }

    public void Complete(Guid projectId) => _running.TryRemove(projectId, out _);
}
