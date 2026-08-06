using System.Data.Common;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Sentinel.Infrastructure.Data;

public class TenantConnectionInterceptor : DbConnectionInterceptor
{
    private readonly TenantSessionState _sessionState;

    public TenantConnectionInterceptor(TenantSessionState sessionState)
    {
        _sessionState = sessionState;
    }

    public override void ConnectionOpened(DbConnection connection, ConnectionEndEventData eventData)
    {
        _sessionState.Invalidate();
        base.ConnectionOpened(connection, eventData);
    }

    public override Task ConnectionOpenedAsync(DbConnection connection, ConnectionEndEventData eventData,
        CancellationToken cancellationToken = default)
    {
        _sessionState.Invalidate();
        return base.ConnectionOpenedAsync(connection, eventData, cancellationToken);
    }

    public override void ConnectionClosed(DbConnection connection, ConnectionEndEventData eventData)
    {
        _sessionState.Invalidate();
        base.ConnectionClosed(connection, eventData);
    }

    public override Task ConnectionClosedAsync(DbConnection connection, ConnectionEndEventData eventData)
    {
        _sessionState.Invalidate();
        return base.ConnectionClosedAsync(connection, eventData);
    }

    public override void ConnectionFailed(DbConnection connection, ConnectionErrorEventData eventData)
    {
        _sessionState.Invalidate();
        base.ConnectionFailed(connection, eventData);
    }

    public override Task ConnectionFailedAsync(DbConnection connection, ConnectionErrorEventData eventData,
        CancellationToken cancellationToken = default)
    {
        _sessionState.Invalidate();
        return base.ConnectionFailedAsync(connection, eventData, cancellationToken);
    }
}
