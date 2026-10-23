using System.Collections.Concurrent;

namespace Sentinel.Infrastructure.Http;

public sealed class InFlightRequestCoalescer
{
    private readonly ConcurrentDictionary<string, Lazy<Task<object?>>> _inFlight = new(StringComparer.Ordinal);

    public async Task<T> RunAsync<T>(string key, Func<Task<T>> factory, CancellationToken cancellationToken)
    {
        Lazy<Task<object?>>? created = null;
        Lazy<Task<object?>> pending = _inFlight.GetOrAdd(key,
            _ => created = new Lazy<Task<object?>>(async () => await factory()));

        if (ReferenceEquals(pending, created))
        {
            _ = pending.Value.ContinueWith(
                _ => _inFlight.TryRemove(new KeyValuePair<string, Lazy<Task<object?>>>(key, pending)),
                CancellationToken.None, TaskContinuationOptions.ExecuteSynchronously, TaskScheduler.Default);
        }

        return (T)(await pending.Value.WaitAsync(cancellationToken))!;
    }
}
