namespace Sentinel.Domain.Abstractions.Persistence;

public interface IUnitOfWork : IDisposable
{
    Task<int> CommitAsync(CancellationToken cancellationToken);
}

public interface IUnitOfWorkManager
{
    IUnitOfWork NewUnitOfWork();

    Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken);
}
