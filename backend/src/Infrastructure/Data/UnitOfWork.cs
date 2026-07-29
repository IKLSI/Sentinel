using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Sentinel.Domain.Abstractions.Persistence;

namespace Sentinel.Infrastructure.Data;

public class UnitOfWork : IUnitOfWork
{
    private readonly SentinelContext _context;
    private readonly IDbContextTransaction? _transaction;
    private bool _committed;
    private bool _disposed;

    internal UnitOfWork(SentinelContext context)
    {
        _context = context;

        if (context.Database.IsRelational() && context.Database.CurrentTransaction == null)
            _transaction = context.Database.BeginTransaction();
    }

    public async Task<int> CommitAsync(CancellationToken cancellationToken)
    {
        int affectedRows = await _context.SaveChangesAsync(cancellationToken);

        if (_transaction != null)
            await _transaction.CommitAsync(cancellationToken);

        _committed = true;

        return affectedRows;
    }

    public void Dispose()
    {
        if (_disposed) return;

        _disposed = true;
        GC.SuppressFinalize(this);

        if (_transaction == null) return;

        if (!_committed)
        {
            _transaction.Rollback();
            _context.ChangeTracker.Clear();
        }

        _transaction.Dispose();
    }
}

public class UnitOfWorkManager : IUnitOfWorkManager
{
    private readonly SentinelContext _context;

    public UnitOfWorkManager(SentinelContext context)
    {
        _context = context;
    }

    public IUnitOfWork NewUnitOfWork() => new UnitOfWork(_context);

    public async Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation,
        CancellationToken cancellationToken)
    {
        if (!_context.Database.IsRelational())
        {
            await operation(cancellationToken);
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
