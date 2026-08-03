using Microsoft.EntityFrameworkCore;
using Sentinel.Infrastructure.Data;

namespace Sentinel.API.Extensions;

public static class DatabaseRoleGuard
{
    private const string BypassQuery =
        "SELECT (rolsuper OR rolbypassrls) AS \"Value\" FROM pg_roles WHERE rolname = current_user";

    public static async Task EnsureRowLevelSecurityAppliesAsync(SentinelContext context)
    {
        List<bool> bypassesRowLevelSecurity = await context.Database
            .SqlQueryRaw<bool>(BypassQuery)
            .ToListAsync();

        if (bypassesRowLevelSecurity.Count == 0 || !bypassesRowLevelSecurity[0]) return;

        throw new InvalidOperationException(
            "The PostgreSQL role used by the application is a superuser or carries the BYPASSRLS attribute: " +
            "Row Level Security policies are not enforced for it, and isolation between organizations " +
            "then relies solely on Entity Framework filters. " +
            "Create a dedicated application role that does not own the tables and has no BYPASSRLS");
    }
}
