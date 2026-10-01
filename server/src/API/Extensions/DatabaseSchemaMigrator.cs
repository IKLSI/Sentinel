using Hangfire.PostgreSql;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Sentinel.Domain.Constants;
using Sentinel.Infrastructure.Data;

namespace Sentinel.API.Extensions;

public static class DatabaseSchemaMigrator
{
    public static async Task MigrateAsync(SentinelContext context, IConfiguration configuration)
    {
        string runtimeConnectionString = context.Database.GetConnectionString()
            ?? throw new InvalidOperationException("The DefaultConnection connection string is missing");

        string? migrationsConnectionString = configuration.GetConnectionString(ConfigurationKeys.MigrationsConnectionString);
        string schemaOwnerConnectionString = string.IsNullOrWhiteSpace(migrationsConnectionString)
            ? runtimeConnectionString
            : migrationsConnectionString;

        context.Database.SetConnectionString(schemaOwnerConnectionString);

        try
        {
            await context.Database.MigrateAsync();
        }
        finally
        {
            context.Database.SetConnectionString(runtimeConnectionString);
        }

        await using NpgsqlConnection connection = new NpgsqlConnection(schemaOwnerConnectionString);
        await connection.OpenAsync();
        PostgreSqlObjectsInstaller.Install(connection);
    }
}
