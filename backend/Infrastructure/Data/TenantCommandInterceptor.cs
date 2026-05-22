using System.Data.Common;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Sentinel.Domain.Abstractions;

namespace Sentinel.Infrastructure.Data;

public class TenantCommandInterceptor : DbCommandInterceptor
{
    private readonly ITenantContext _tenant;

    public TenantCommandInterceptor(ITenantContext tenant)
    {
        _tenant = tenant;
    }

    public override InterceptionResult<DbDataReader> ReaderExecuting(
        DbCommand command,
        CommandEventData eventData,
        InterceptionResult<DbDataReader> result)
    {
        SetTenantConfig(command);
        return base.ReaderExecuting(command, eventData, result);
    }

    public override async ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(
        DbCommand command,
        CommandEventData eventData,
        InterceptionResult<DbDataReader> result,
        CancellationToken cancellationToken = default)
    {
        await SetTenantConfigAsync(command, cancellationToken);
        return await base.ReaderExecutingAsync(command, eventData, result, cancellationToken);
    }

    public override InterceptionResult<int> NonQueryExecuting(
        DbCommand command,
        CommandEventData eventData,
        InterceptionResult<int> result)
    {
        SetTenantConfig(command);
        return base.NonQueryExecuting(command, eventData, result);
    }

    public override async ValueTask<InterceptionResult<int>> NonQueryExecutingAsync(
        DbCommand command,
        CommandEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        await SetTenantConfigAsync(command, cancellationToken);
        return await base.NonQueryExecutingAsync(command, eventData, result, cancellationToken);
    }

    public override InterceptionResult<object> ScalarExecuting(
        DbCommand command,
        CommandEventData eventData,
        InterceptionResult<object> result)
    {
        SetTenantConfig(command);
        return base.ScalarExecuting(command, eventData, result);
    }

    public override async ValueTask<InterceptionResult<object>> ScalarExecutingAsync(
        DbCommand command,
        CommandEventData eventData,
        InterceptionResult<object> result,
        CancellationToken cancellationToken = default)
    {
        await SetTenantConfigAsync(command, cancellationToken);
        return await base.ScalarExecutingAsync(command, eventData, result, cancellationToken);
    }

    private void SetTenantConfig(DbCommand command)
    {
        if (command.Connection == null) return;
        string orgValue = _tenant.OrganizationId?.ToString() ?? string.Empty;
        using DbCommand setCmd = command.Connection.CreateCommand();
        setCmd.Transaction = command.Transaction;
        setCmd.CommandText = $"SET app.current_org = '{orgValue}'";
        setCmd.ExecuteNonQuery();
    }

    private async Task SetTenantConfigAsync(DbCommand command, CancellationToken cancellationToken)
    {
        if (command.Connection == null) return;
        string orgValue = _tenant.OrganizationId?.ToString() ?? string.Empty;
        await using DbCommand setCmd = command.Connection.CreateCommand();
        setCmd.Transaction = command.Transaction;
        setCmd.CommandText = $"SET app.current_org = '{orgValue}'";
        await setCmd.ExecuteNonQueryAsync(cancellationToken);
    }
}
