using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.TechHealth.Scan;

public sealed record RuntimeEolResult(Runtime Runtime, bool? IsEol, DateTime? EolDate);

public class RuntimeEolScanService(IRuntimeLifecycleClient runtimeLifecycle)
{
    private const int MaxConcurrentLookups = 10;

    public async Task<IReadOnlyList<RuntimeEolResult>> ScanAsync(IReadOnlyCollection<Runtime> runtimes)
    {
        if (runtimes.Count == 0) return [];

        using SemaphoreSlim throttle = new SemaphoreSlim(MaxConcurrentLookups);

        RuntimeEolResult?[] results = await Task.WhenAll(runtimes.Select(async runtime =>
        {
            await throttle.WaitAsync();
            try { return await FetchAsync(runtime); }
            finally { throttle.Release(); }
        }));

        return results.OfType<RuntimeEolResult>().ToList();
    }

    private async Task<RuntimeEolResult?> FetchAsync(Runtime runtime)
    {
        RuntimeLifecycle? lifecycle = await runtimeLifecycle.GetLifecycleAsync(runtime.Name, runtime.Version);

        if (lifecycle == null) return null;

        if (lifecycle.EndOfLifeDate is DateTime eolDate)
            return new RuntimeEolResult(runtime, eolDate < DateTime.UtcNow, eolDate);

        return new RuntimeEolResult(runtime, lifecycle.IsEndOfLife, null);
    }
}
