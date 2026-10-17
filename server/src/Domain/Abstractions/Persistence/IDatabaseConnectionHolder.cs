namespace Sentinel.Domain.Abstractions.Persistence;

public interface IDatabaseConnectionHolder
{
    Task<IAsyncDisposable> HoldOpenAsync(CancellationToken cancellationToken);
}
