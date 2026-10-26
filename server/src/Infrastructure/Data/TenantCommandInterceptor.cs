using System.Data.Common;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Sentinel.Domain.Abstractions;

namespace Sentinel.Infrastructure.Data;

public class TenantCommandInterceptor : DbCommandInterceptor
{
    private const string SystemSentinel = "system";
    private const string TenantParameterName = "@tenant_org";
    private const string SetTenantStatement = "SELECT set_config('app.current_org', " + TenantParameterName + ", false)";
    private readonly ITenantContext _tenant;
    private readonly ISystemScope _systemScope;
    private readonly TenantSessionState _sessionState;
    private (DbCommand Command, string Value)? _pendingInlineConfig;

    public TenantCommandInterceptor(ITenantContext tenant, ISystemScope systemScope,
        TenantSessionState sessionState)
    {
        _tenant = tenant;
        _systemScope = systemScope;
        _sessionState = sessionState;
    }

    public override InterceptionResult<DbDataReader> ReaderExecuting(
        DbCommand command,
        CommandEventData eventData,
        InterceptionResult<DbDataReader> result)
    {
        if (PendingTenantValue(command) is { } value)
        {
            if (IsQuery(eventData)) InlineTenantConfig(command, value);
            else SetTenantConfig(command, value);
        }

        return base.ReaderExecuting(command, eventData, result);
    }

    public override async ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(
        DbCommand command,
        CommandEventData eventData,
        InterceptionResult<DbDataReader> result,
        CancellationToken cancellationToken = default)
    {
        if (PendingTenantValue(command) is { } value)
        {
            if (IsQuery(eventData)) InlineTenantConfig(command, value);
            else await SetTenantConfigAsync(command, value, cancellationToken);
        }

        return await base.ReaderExecutingAsync(command, eventData, result, cancellationToken);
    }

    public override DbDataReader ReaderExecuted(
        DbCommand command,
        CommandExecutedEventData eventData,
        DbDataReader result)
    {
        if (TakeInlinedValue(command) is { } value)
        {
            result.NextResult();
            _sessionState.MarkApplied(value, command.Transaction);
        }

        return base.ReaderExecuted(command, eventData, result);
    }

    public override async ValueTask<DbDataReader> ReaderExecutedAsync(
        DbCommand command,
        CommandExecutedEventData eventData,
        DbDataReader result,
        CancellationToken cancellationToken = default)
    {
        if (TakeInlinedValue(command) is { } value)
        {
            await result.NextResultAsync(cancellationToken);
            _sessionState.MarkApplied(value, command.Transaction);
        }

        return await base.ReaderExecutedAsync(command, eventData, result, cancellationToken);
    }

    public override InterceptionResult<int> NonQueryExecuting(
        DbCommand command,
        CommandEventData eventData,
        InterceptionResult<int> result)
    {
        if (PendingTenantValue(command) is { } value) SetTenantConfig(command, value);
        return base.NonQueryExecuting(command, eventData, result);
    }

    public override async ValueTask<InterceptionResult<int>> NonQueryExecutingAsync(
        DbCommand command,
        CommandEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        if (PendingTenantValue(command) is { } value) await SetTenantConfigAsync(command, value, cancellationToken);
        return await base.NonQueryExecutingAsync(command, eventData, result, cancellationToken);
    }

    public override InterceptionResult<object> ScalarExecuting(
        DbCommand command,
        CommandEventData eventData,
        InterceptionResult<object> result)
    {
        if (PendingTenantValue(command) is { } value) SetTenantConfig(command, value);
        return base.ScalarExecuting(command, eventData, result);
    }

    public override async ValueTask<InterceptionResult<object>> ScalarExecutingAsync(
        DbCommand command,
        CommandEventData eventData,
        InterceptionResult<object> result,
        CancellationToken cancellationToken = default)
    {
        if (PendingTenantValue(command) is { } value) await SetTenantConfigAsync(command, value, cancellationToken);
        return await base.ScalarExecutingAsync(command, eventData, result, cancellationToken);
    }

    private static bool IsQuery(CommandEventData eventData) =>
        eventData.CommandSource is CommandSource.LinqQuery or CommandSource.FromSqlQuery;

    private string? PendingTenantValue(DbCommand command)
    {
        if (command.Connection == null) return null;

        string value = _systemScope.IsActive
            ? SystemSentinel
            : _tenant.OrganizationId?.ToString() ?? string.Empty;

        return _sessionState.IsApplied(value, command.Transaction) ? null : value;
    }

    private static void AddTenantParameter(DbCommand command, string value)
    {
        DbParameter parameter = command.CreateParameter();
        parameter.ParameterName = TenantParameterName;
        parameter.Value = value;
        command.Parameters.Add(parameter);
    }

    private void InlineTenantConfig(DbCommand command, string value)
    {
        command.CommandText = $"{SetTenantStatement};{Environment.NewLine}{command.CommandText}";
        AddTenantParameter(command, value);
        _pendingInlineConfig = (command, value);
    }

    private string? TakeInlinedValue(DbCommand command)
    {
        if (_pendingInlineConfig is not { } pending || !ReferenceEquals(pending.Command, command)) return null;

        _pendingInlineConfig = null;

        return pending.Value;
    }

    private static DbCommand BuildSetTenantCommand(DbCommand command, string value)
    {
        DbCommand setCommand = command.Connection!.CreateCommand();
        setCommand.Transaction = command.Transaction;
        setCommand.CommandText = SetTenantStatement;
        AddTenantParameter(setCommand, value);

        return setCommand;
    }

    private void SetTenantConfig(DbCommand command, string value)
    {
        using (DbCommand setCommand = BuildSetTenantCommand(command, value))
        {
            setCommand.ExecuteNonQuery();
        }

        _sessionState.MarkApplied(value, command.Transaction);
    }

    private async Task SetTenantConfigAsync(DbCommand command, string value, CancellationToken cancellationToken)
    {
        await using (DbCommand setCommand = BuildSetTenantCommand(command, value))
        {
            await setCommand.ExecuteNonQueryAsync(cancellationToken);
        }

        _sessionState.MarkApplied(value, command.Transaction);
    }
}
