using Sentinel.Domain.Models;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.TechHealth;

public partial class TechHealthService
{
    private sealed record RuntimeEolResult(Runtime Runtime, bool? IsEol, DateTime? EolDate);

    private async Task<RuntimeEolResult?> FetchRuntimeEolAsync(Runtime runtime)
    {
        RuntimeLifecycle? lifecycle = await _runtimeLifecycle.GetLifecycleAsync(runtime.Name, runtime.Version);

        if (lifecycle == null) return null;

        if (lifecycle.EndOfLifeDate is DateTime eolDate)
            return new RuntimeEolResult(runtime, eolDate < DateTime.UtcNow, eolDate);

        return new RuntimeEolResult(runtime, lifecycle.IsEndOfLife, null);
    }
}
