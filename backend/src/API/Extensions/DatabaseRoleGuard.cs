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
            "Le rôle PostgreSQL utilisé par l'application est superutilisateur ou porte l'attribut BYPASSRLS : " +
            "les politiques de Row Level Security ne lui sont pas appliquées et l'isolation entre organisations " +
            "ne repose plus que sur les filtres Entity Framework. " +
            "Créer un rôle applicatif dédié, non propriétaire des tables, sans BYPASSRLS");
    }
}
