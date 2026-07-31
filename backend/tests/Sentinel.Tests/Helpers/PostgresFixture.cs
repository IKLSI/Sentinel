using Microsoft.EntityFrameworkCore;
using Npgsql;
using Sentinel.Domain.Abstractions;
using Sentinel.Infrastructure.Data;
using Testcontainers.PostgreSql;

namespace Sentinel.Tests.Helpers;

public sealed class PostgresFixture : IAsyncLifetime
{
    private const string Image = "postgres:17-alpine";
    private const string ExternalDatabaseVariable = "SENTINEL_TEST_POSTGRES";
    private const string AppRole = "sentinel_app";
    private const string AppRolePassword = "sentinel_app";

    private PostgreSqlContainer? _container;
    private string? _unavailableReason;

    public string ConnectionString { get; private set; } = string.Empty;

    public async ValueTask InitializeAsync()
    {
        string? externalDatabase = Environment.GetEnvironmentVariable(ExternalDatabaseVariable);

        try
        {
            if (!string.IsNullOrWhiteSpace(externalDatabase))
            {
                ConnectionString = externalDatabase;
            }
            else
            {
                _container = new PostgreSqlBuilder(Image)
                    .WithDatabase("sentinel_tests")
                    .WithUsername("sentinel")
                    .WithPassword("sentinel")
                    .Build();

                await _container.StartAsync();

                ConnectionString = _container.GetConnectionString();
            }

            await using SentinelContext context = new SentinelContext(BuildOptions(null));

            await context.Database.MigrateAsync();

            ConnectionString = await CreateRestrictedAppConnectionStringAsync();
        }
        catch (Exception exception)
        {
            _unavailableReason = exception.Message;
        }
    }

    private async Task<string> CreateRestrictedAppConnectionStringAsync()
    {
        await using NpgsqlConnection adminConnection = new NpgsqlConnection(ConnectionString);
        await adminConnection.OpenAsync();

        await using (NpgsqlCommand command = adminConnection.CreateCommand())
        {
            command.CommandText = $@"
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '{AppRole}') THEN
        CREATE ROLE {AppRole} LOGIN PASSWORD '{AppRolePassword}' NOSUPERUSER NOBYPASSRLS;
    END IF;
END
$$;
GRANT USAGE ON SCHEMA public TO {AppRole};
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO {AppRole};
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO {AppRole};";

            await command.ExecuteNonQueryAsync();
        }

        NpgsqlConnectionStringBuilder builder = new NpgsqlConnectionStringBuilder(ConnectionString)
        {
            Username = AppRole,
            Password = AppRolePassword
        };

        return builder.ToString();
    }

    public async ValueTask DisposeAsync()
    {
        if (_container == null) return;

        await _container.DisposeAsync();
    }

    public void EnsureAvailable()
    {
        if (_unavailableReason == null) return;

        if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("CI")))
            throw new InvalidOperationException(
                $"Une base PostgreSQL est requise pour les tests d'intégration en intégration continue : {_unavailableReason}");

        Assert.Skip(
            $"PostgreSQL indisponible, tests d'intégration ignorés. Démarrez Docker, ou renseignez "
            + $"{ExternalDatabaseVariable} avec la chaîne de connexion d'une base jetable. Détail : {_unavailableReason}");
    }

    public SentinelContext CreateContext(ITenantContext tenant, ISystemScope systemScope)
    {
        TenantSessionState sessionState = new TenantSessionState();

        return new SentinelContext(
            BuildOptions(new TenantCommandInterceptor(tenant, systemScope, sessionState),
                new TenantConnectionInterceptor(sessionState)),
            tenant,
            systemScope);
    }

    private DbContextOptions<SentinelContext> BuildOptions(TenantCommandInterceptor? commandInterceptor,
        TenantConnectionInterceptor? connectionInterceptor = null)
    {
        DbContextOptionsBuilder<SentinelContext> builder = new DbContextOptionsBuilder<SentinelContext>()
            .UseNpgsql(ConnectionString, npgsql => npgsql.EnableRetryOnFailure(3, TimeSpan.FromSeconds(1), null));

        if (commandInterceptor != null)
            builder.AddInterceptors(commandInterceptor);

        if (connectionInterceptor != null)
            builder.AddInterceptors(connectionInterceptor);

        return builder.Options;
    }
}

[CollectionDefinition(Name)]
public class PostgresCollection : ICollectionFixture<PostgresFixture>
{
    public const string Name = "Postgres";
}
