using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;

namespace Sentinel.Infrastructure.Data;

public class DatabaseConnectionHolder(SentinelContext context) : IDatabaseConnectionHolder
{
    public async Task<IAsyncDisposable> HoldOpenAsync(CancellationToken cancellationToken)
    {
        await context.Database.OpenConnectionAsync(cancellationToken);
        return new OpenConnection(context);
    }

    private sealed class OpenConnection(SentinelContext context) : IAsyncDisposable
    {
        public async ValueTask DisposeAsync() => await context.Database.CloseConnectionAsync();
    }
}
