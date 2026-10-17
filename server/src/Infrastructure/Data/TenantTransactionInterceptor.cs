using System.Data.Common;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Sentinel.Infrastructure.Data;

public class TenantTransactionInterceptor : DbTransactionInterceptor
{
    private readonly TenantSessionState _sessionState;

    public TenantTransactionInterceptor(TenantSessionState sessionState)
    {
        _sessionState = sessionState;
    }

    public override DbTransaction TransactionStarted(DbConnection connection, TransactionEndEventData eventData,
        DbTransaction result)
    {
        _sessionState.InvalidateIfUncommitted();
        return base.TransactionStarted(connection, eventData, result);
    }

    public override ValueTask<DbTransaction> TransactionStartedAsync(DbConnection connection,
        TransactionEndEventData eventData, DbTransaction result, CancellationToken cancellationToken = default)
    {
        _sessionState.InvalidateIfUncommitted();
        return base.TransactionStartedAsync(connection, eventData, result, cancellationToken);
    }

    public override void TransactionCommitted(DbTransaction transaction, TransactionEndEventData eventData)
    {
        _sessionState.MarkCommitted(transaction);
        base.TransactionCommitted(transaction, eventData);
    }

    public override Task TransactionCommittedAsync(DbTransaction transaction, TransactionEndEventData eventData,
        CancellationToken cancellationToken = default)
    {
        _sessionState.MarkCommitted(transaction);
        return base.TransactionCommittedAsync(transaction, eventData, cancellationToken);
    }

    public override void TransactionRolledBack(DbTransaction transaction, TransactionEndEventData eventData)
    {
        _sessionState.InvalidateIfUncommitted();
        base.TransactionRolledBack(transaction, eventData);
    }

    public override Task TransactionRolledBackAsync(DbTransaction transaction, TransactionEndEventData eventData,
        CancellationToken cancellationToken = default)
    {
        _sessionState.InvalidateIfUncommitted();
        return base.TransactionRolledBackAsync(transaction, eventData, cancellationToken);
    }

    public override void RolledBackToSavepoint(DbTransaction transaction, TransactionEventData eventData)
    {
        _sessionState.Invalidate();
        base.RolledBackToSavepoint(transaction, eventData);
    }

    public override Task RolledBackToSavepointAsync(DbTransaction transaction, TransactionEventData eventData,
        CancellationToken cancellationToken = default)
    {
        _sessionState.Invalidate();
        return base.RolledBackToSavepointAsync(transaction, eventData, cancellationToken);
    }

    public override void TransactionFailed(DbTransaction transaction, TransactionErrorEventData eventData)
    {
        _sessionState.Invalidate();
        base.TransactionFailed(transaction, eventData);
    }

    public override Task TransactionFailedAsync(DbTransaction transaction, TransactionErrorEventData eventData,
        CancellationToken cancellationToken = default)
    {
        _sessionState.Invalidate();
        return base.TransactionFailedAsync(transaction, eventData, cancellationToken);
    }
}
