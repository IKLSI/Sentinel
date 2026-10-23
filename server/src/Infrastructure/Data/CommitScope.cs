using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Npgsql;
using Sentinel.Domain.Abstractions.Persistence;

namespace Sentinel.Infrastructure.Data;

public class CommitScope : ICommitScope
{
    private readonly SentinelContext _context;
    private bool _committed;
    private bool _disposed;

    internal CommitScope(SentinelContext context)
    {
        _context = context;
    }

    public async Task<int> CommitAsync(CancellationToken cancellationToken)
    {
        if (_committed)
            throw new InvalidOperationException(
                "This commit scope has already been committed: open a new one, or use ExecuteInTransactionAsync to group several saves in a single transaction");

        int affectedRows;

        try
        {
            affectedRows = await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (IsUniqueViolation(exception))
        {
            throw new UniqueConstraintViolationException(exception);
        }
        catch (DbUpdateException exception) when (exception is not DbUpdateConcurrencyException)
        {
            throw new PersistenceException("The database save was rejected", exception);
        }

        _committed = true;

        return affectedRows;
    }

    internal static bool IsUniqueViolation(DbUpdateException exception) =>
        exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };

    public void Dispose()
    {
        if (_disposed) return;

        _disposed = true;

        if (!_committed)
            _context.ChangeTracker.Clear();
    }
}

public class CommitScopeFactory : ICommitScopeFactory
{
    private readonly SentinelContext _context;

    public CommitScopeFactory(SentinelContext context)
    {
        _context = context;
    }

    public ICommitScope Begin() => new CommitScope(_context);

    public async Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation,
        CancellationToken cancellationToken)
    {
        IExecutionStrategy strategy = _context.Database.CreateExecutionStrategy();

        await strategy.ExecuteAsync(async () =>
        {
            _context.ChangeTracker.Clear();

            await using IDbContextTransaction transaction =
                await _context.Database.BeginTransactionAsync(cancellationToken);

            try
            {
                await operation(cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException exception) when (CommitScope.IsUniqueViolation(exception))
            {
                throw new UniqueConstraintViolationException(exception);
            }

            await transaction.CommitAsync(cancellationToken);
        });
    }
}
