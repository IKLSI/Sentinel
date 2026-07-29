using System.Data.Common;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Sentinel.Domain.Abstractions;

namespace Sentinel.Infrastructure.Data;

public class TenantCommandInterceptor : DbCommandInterceptor
{
    private const string SystemSentinel = "system";
    private readonly ITenantContext _tenant;
    private readonly ISystemScope _systemScope;

    public TenantCommandInterceptor(ITenantContext tenant, ISystemScope systemScope)
    {
        _tenant = tenant;
        _systemScope = systemScope;
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

    private string ResolveOrgValue() =>
        _systemScope.IsActive
            ? SystemSentinel
            : _tenant.OrganizationId?.ToString() ?? string.Empty;

    private void SetTenantConfig(DbCommand command)
    {
        if (command.Connection == null) return;
        using DbCommand setCmd = command.Connection.CreateCommand();
        setCmd.Transaction = command.Transaction;
        setCmd.CommandText = "SELECT set_config('app.current_org', @org, false)";
        DbParameter parameter = setCmd.CreateParameter();
        parameter.ParameterName = "@org";
        parameter.Value = ResolveOrgValue();
        setCmd.Parameters.Add(parameter);
        setCmd.ExecuteNonQuery();
    }

    private async Task SetTenantConfigAsync(DbCommand command, CancellationToken cancellationToken)
    {
        if (command.Connection == null) return;
        await using DbCommand setCmd = command.Connection.CreateCommand();
        setCmd.Transaction = command.Transaction;
        setCmd.CommandText = "SELECT set_config('app.current_org', @org, false)";
        DbParameter parameter = setCmd.CreateParameter();
        parameter.ParameterName = "@org";
        parameter.Value = ResolveOrgValue();
        setCmd.Parameters.Add(parameter);
        await setCmd.ExecuteNonQueryAsync(cancellationToken);
    }
}
