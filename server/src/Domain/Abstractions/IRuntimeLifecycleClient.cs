using Sentinel.Domain.TechHealth;

namespace Sentinel.Domain.Abstractions;

public interface IRuntimeLifecycleClient
{
    Task<RuntimeLifecycle?> GetLifecycleAsync(string runtimeName, string version,
        CancellationToken cancellationToken);
}
