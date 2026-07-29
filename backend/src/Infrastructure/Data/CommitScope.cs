using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
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
                "Cette portée de validation a déjà été validée : ouvrez-en une nouvelle, ou utilisez ExecuteInTransactionAsync pour regrouper plusieurs enregistrements dans une même transaction");

        int affectedRows;

        try
        {
            affectedRows = await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (exception is not DbUpdateConcurrencyException)
        {
            throw new PersistenceException("L'enregistrement en base a été rejeté", exception);
        }

        _committed = true;

        return affectedRows;
    }

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
        if (!_context.Database.IsRelational())
        {
            await operation(cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            return;
        }

        IExecutionStrategy strategy = _context.Database.CreateExecutionStrategy();

        await strategy.ExecuteAsync(async () =>
        {
            await using IDbContextTransaction transaction =
                await _context.Database.BeginTransactionAsync(cancellationToken);

            await operation(cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        });
    }
}
