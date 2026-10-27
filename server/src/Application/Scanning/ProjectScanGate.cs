using System.Collections.Concurrent;

namespace Sentinel.Application.Scanning;

public enum ScanQueueing
{
    NewJob,
    Revived,
    AlreadyPending
}

public enum ScanCancellation
{
    Withdrawn,
    Interrupted,
    NotCancellable
}

public sealed class ProjectScanGate
{
    private static readonly TimeSpan QueueExpiry = TimeSpan.FromHours(3);

    private readonly ConcurrentDictionary<Guid, DateTime> _queued = new();
    private readonly ConcurrentDictionary<Guid, DateTime> _withdrawn = new();
    private readonly ConcurrentDictionary<Guid, RunningScan> _running = new();

    public ScanQueueing Queue(Guid projectId)
    {
        if (_running.ContainsKey(projectId)) return ScanQueueing.AlreadyPending;

        DateTime now = DateTime.UtcNow;

        if (_withdrawn.TryRemove(projectId, out DateTime withdrawnAt) && now - withdrawnAt < QueueExpiry)
        {
            _queued[projectId] = now;
            return ScanQueueing.Revived;
        }

        if (_queued.TryAdd(projectId, now)) return ScanQueueing.NewJob;

        if (!_queued.TryGetValue(projectId, out DateTime queuedAt) || now - queuedAt < QueueExpiry)
            return ScanQueueing.AlreadyPending;

        return _queued.TryUpdate(projectId, now, queuedAt) ? ScanQueueing.NewJob : ScanQueueing.AlreadyPending;
    }

    public CancellationTokenSource? TryStart(Guid projectId, CancellationToken jobToken)
    {
        if (_withdrawn.TryRemove(projectId, out _)) return null;

        _queued.TryRemove(projectId, out _);

        CancellationTokenSource cancellation = CancellationTokenSource.CreateLinkedTokenSource(jobToken);

        if (_running.TryAdd(projectId, new RunningScan(cancellation))) return cancellation;

        cancellation.Dispose();
        return null;
    }

    public ScanCancellation TryCancel(Guid projectId)
    {
        if (_queued.TryRemove(projectId, out _))
        {
            _withdrawn[projectId] = DateTime.UtcNow;
            return ScanCancellation.Withdrawn;
        }

        if (!_running.TryGetValue(projectId, out RunningScan? scan) || scan.Sealed)
            return ScanCancellation.NotCancellable;

        try
        {
            scan.Cancellation.Cancel();
            return ScanCancellation.Interrupted;
        }
        catch (ObjectDisposedException)
        {
            return ScanCancellation.NotCancellable;
        }
    }

    public void Seal(Guid projectId)
    {
        if (_running.TryGetValue(projectId, out RunningScan? scan)) scan.Sealed = true;
    }

    public void Complete(Guid projectId) => _running.TryRemove(projectId, out _);

    private sealed class RunningScan(CancellationTokenSource cancellation)
    {
        public CancellationTokenSource Cancellation { get; } = cancellation;

        public bool Sealed { get; set; }
    }
}
