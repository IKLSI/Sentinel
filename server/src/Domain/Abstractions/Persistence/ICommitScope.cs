namespace Sentinel.Domain.Abstractions.Persistence;

public interface ICommitScope : IDisposable
{
    Task<int> CommitAsync(CancellationToken cancellationToken);
}

public interface ICommitScopeFactory
{
    ICommitScope Begin();

    Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken);
}
