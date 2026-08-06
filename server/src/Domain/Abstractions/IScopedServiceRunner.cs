namespace Sentinel.Domain.Abstractions;

public interface IScopedServiceRunner
{
    Task RunAsync<TService>(Func<TService, Task> operation)
        where TService : notnull;
}
