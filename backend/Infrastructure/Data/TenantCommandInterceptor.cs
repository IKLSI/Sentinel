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
        InjectTenant(command);
        return base.ReaderExecuting(command, eventData, result);
    }

    public override ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(
        DbCommand command,
        CommandEventData eventData,
        InterceptionResult<DbDataReader> result,
        CancellationToken cancellationToken = default)
    {
        InjectTenant(command);
        return base.ReaderExecutingAsync(command, eventData, result, cancellationToken);
    }

    public override InterceptionResult<int> NonQueryExecuting(
        DbCommand command,
        CommandEventData eventData,
        InterceptionResult<int> result)
    {
        InjectTenant(command);
        return base.NonQueryExecuting(command, eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> NonQueryExecutingAsync(
        DbCommand command,
        CommandEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        InjectTenant(command);
        return base.NonQueryExecutingAsync(command, eventData, result, cancellationToken);
    }

    public override InterceptionResult<object> ScalarExecuting(
        DbCommand command,
        CommandEventData eventData,
        InterceptionResult<object> result)
    {
        InjectTenant(command);
        return base.ScalarExecuting(command, eventData, result);
    }

    public override ValueTask<InterceptionResult<object>> ScalarExecutingAsync(
        DbCommand command,
        CommandEventData eventData,
        InterceptionResult<object> result,
        CancellationToken cancellationToken = default)
    {
        InjectTenant(command);
        return base.ScalarExecutingAsync(command, eventData, result, cancellationToken);
    }

    private void InjectTenant(DbCommand command)
    {
        string orgValue = _tenant.OrganizationId?.ToString() ?? string.Empty;
        command.CommandText = $"SELECT set_config('app.current_org', '{orgValue}', true); " + command.CommandText;
    }
}
