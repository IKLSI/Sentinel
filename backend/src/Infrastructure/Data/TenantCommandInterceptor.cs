using System.Data.Common;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Sentinel.Domain.Abstractions;

namespace Sentinel.Infrastructure.Data;

public class TenantCommandInterceptor : DbCommandInterceptor
{
    private const string SystemSentinel = "system";
    private readonly ITenantContext _tenant;
    private readonly ISystemScope _systemScope;

    private DbTransaction? _appliedTransaction;
    private string? _appliedValue;

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

    private bool IsAlreadyAppliedInTransaction(DbCommand command, string value) =>
        command.Transaction is not null
        && ReferenceEquals(command.Transaction, _appliedTransaction)
        && _appliedValue == value;

    private void RememberApplied(DbCommand command, string value)
    {
        _appliedTransaction = command.Transaction;
        _appliedValue = value;
    }

    private static DbCommand BuildSetTenantCommand(DbCommand command, string value)
    {
        DbCommand setCommand = command.Connection!.CreateCommand();
        setCommand.Transaction = command.Transaction;
        setCommand.CommandText = "SELECT set_config('app.current_org', @org, false)";

        DbParameter parameter = setCommand.CreateParameter();
        parameter.ParameterName = "@org";
        parameter.Value = value;
        setCommand.Parameters.Add(parameter);

        return setCommand;
    }

    private void SetTenantConfig(DbCommand command)
    {
        if (command.Connection == null) return;

        string value = ResolveOrgValue();

        if (IsAlreadyAppliedInTransaction(command, value)) return;

        using (DbCommand setCommand = BuildSetTenantCommand(command, value))
        {
            setCommand.ExecuteNonQuery();
        }

        RememberApplied(command, value);
    }

    private async Task SetTenantConfigAsync(DbCommand command, CancellationToken cancellationToken)
    {
        if (command.Connection == null) return;

        string value = ResolveOrgValue();

        if (IsAlreadyAppliedInTransaction(command, value)) return;

        await using (DbCommand setCommand = BuildSetTenantCommand(command, value))
        {
            await setCommand.ExecuteNonQueryAsync(cancellationToken);
        }

        RememberApplied(command, value);
    }
}
