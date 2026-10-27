using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.Scanning;

public sealed record RuntimeEolResult(Runtime Runtime, bool? IsEol, DateTime? EolDate);

public class RuntimeEolScanService(IRuntimeLifecycleClient runtimeLifecycle)
{
    private const int MaxConcurrentLookups = 10;

    public async Task<IReadOnlyList<RuntimeEolResult>> ScanAsync(IReadOnlyCollection<Runtime> runtimes,
        CancellationToken cancellationToken)
    {
        if (runtimes.Count == 0) return [];

        using SemaphoreSlim throttle = new SemaphoreSlim(MaxConcurrentLookups);

        RuntimeEolResult?[] results = await Task.WhenAll(runtimes.Select(async runtime =>
        {
            await throttle.WaitAsync(cancellationToken);
            try { return await FetchAsync(runtime, cancellationToken); }
            finally { throttle.Release(); }
        }));

        return results.OfType<RuntimeEolResult>().ToList();
    }

    private async Task<RuntimeEolResult?> FetchAsync(Runtime runtime, CancellationToken cancellationToken)
    {
        RuntimeLifecycle? lifecycle = await runtimeLifecycle.GetLifecycleAsync(runtime.Name, runtime.Version,
            cancellationToken);

        if (lifecycle == null) return null;

        return new RuntimeEolResult(runtime, lifecycle.IsEolAt(DateTime.UtcNow), lifecycle.EndOfLifeDate);
    }
}
