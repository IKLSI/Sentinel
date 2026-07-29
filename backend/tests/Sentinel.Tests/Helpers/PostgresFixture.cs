using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions;
using Sentinel.Infrastructure.Data;
using Testcontainers.PostgreSql;

namespace Sentinel.Tests.Helpers;

public sealed class PostgresFixture : IAsyncLifetime
{
    private const string Image = "postgres:17-alpine";
    private const string ExternalDatabaseVariable = "SENTINEL_TEST_POSTGRES";

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
                _container = new PostgreSqlBuilder()
                    .WithImage(Image)
                    .WithDatabase("sentinel_tests")
                    .WithUsername("sentinel")
                    .WithPassword("sentinel")
                    .Build();

                await _container.StartAsync();

                ConnectionString = _container.GetConnectionString();
            }

            await using SentinelContext context = new SentinelContext(BuildOptions(null));

            await context.Database.MigrateAsync();
        }
        catch (Exception exception)
        {
            _unavailableReason = exception.Message;
        }
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

    public SentinelContext CreateContext(ITenantContext tenant, ISystemScope systemScope) =>
        new(BuildOptions(new TenantCommandInterceptor(tenant, systemScope)), tenant);

    private DbContextOptions<SentinelContext> BuildOptions(TenantCommandInterceptor? interceptor)
    {
        DbContextOptionsBuilder<SentinelContext> builder = new DbContextOptionsBuilder<SentinelContext>()
            .UseNpgsql(ConnectionString, npgsql => npgsql.EnableRetryOnFailure(3, TimeSpan.FromSeconds(1), null));

        if (interceptor != null)
            builder.AddInterceptors(interceptor);

        return builder.Options;
    }
}

[CollectionDefinition(Name)]
public class PostgresCollection : ICollectionFixture<PostgresFixture>
{
    public const string Name = "Postgres";
}
