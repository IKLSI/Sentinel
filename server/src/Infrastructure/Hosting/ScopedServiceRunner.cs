using Microsoft.Extensions.DependencyInjection;
using Sentinel.Domain.Abstractions;

namespace Sentinel.Infrastructure.Hosting;

public sealed class ScopedServiceRunner(IServiceScopeFactory scopeFactory) : IScopedServiceRunner
{
    public async Task RunAsync<TService>(Func<TService, Task> operation)
        where TService : notnull
    {
        using IServiceScope scope = scopeFactory.CreateScope();

        await operation(scope.ServiceProvider.GetRequiredService<TService>());
    }
}
