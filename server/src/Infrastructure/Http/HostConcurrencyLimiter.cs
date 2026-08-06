using System.Collections.Concurrent;

namespace Sentinel.Infrastructure.Http;

public sealed class HostConcurrencyLimiter
{
    public const int MaxConcurrentRequestsPerHost = 12;

    private readonly ConcurrentDictionary<string, SemaphoreSlim> _gates =
        new(StringComparer.OrdinalIgnoreCase);

    public SemaphoreSlim GateFor(string host) =>
        _gates.GetOrAdd(host, _ => new SemaphoreSlim(MaxConcurrentRequestsPerHost));
}
