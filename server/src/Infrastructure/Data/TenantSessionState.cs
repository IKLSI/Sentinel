using System.Data.Common;

namespace Sentinel.Infrastructure.Data;

public sealed class TenantSessionState
{
    private readonly Lock _gate = new Lock();
    private string? _appliedValue;
    private DbTransaction? _uncommittedTransaction;

    public bool IsApplied(string value, DbTransaction? transaction)
    {
        lock (_gate)
        {
            if (_appliedValue != value) return false;

            return _uncommittedTransaction is null || ReferenceEquals(_uncommittedTransaction, transaction);
        }
    }

    public void MarkApplied(string value, DbTransaction? transaction)
    {
        lock (_gate)
        {
            _appliedValue = value;
            _uncommittedTransaction = transaction;
        }
    }

    public void MarkCommitted(DbTransaction transaction)
    {
        lock (_gate)
        {
            if (ReferenceEquals(_uncommittedTransaction, transaction)) _uncommittedTransaction = null;
        }
    }

    public void InvalidateIfUncommitted()
    {
        lock (_gate)
        {
            if (_uncommittedTransaction is null) return;

            _appliedValue = null;
            _uncommittedTransaction = null;
        }
    }

    public void Invalidate()
    {
        lock (_gate)
        {
            _appliedValue = null;
            _uncommittedTransaction = null;
        }
    }
}
