using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Sentinel.API.Options;
using Sentinel.Domain.Constants;
using Sentinel.Infrastructure.Data;

namespace Sentinel.API.Extensions;

public static partial class ServiceCollectionExtensions
{
    public static IServiceCollection AddDatabase(this IServiceCollection services, IConfiguration configuration)
    {
        string connectionString = configuration.GetConnectionString(ConfigurationKeys.DefaultConnectionString)
            ?? throw new InvalidOperationException("The DefaultConnection connection string is missing");

        services.AddScoped<TenantSessionState>();
        services.AddScoped<TenantCommandInterceptor>();
        services.AddScoped<TenantConnectionInterceptor>();

        DatabaseSettings database = ReadSettings<DatabaseSettings>(configuration, ConfigurationKeys.Sections.Database);

        NpgsqlConnectionStringBuilder dbBuilder = new NpgsqlConnectionStringBuilder(connectionString)
        {
            MaxPoolSize = database.MaxPoolSize
        };

        EnsureSessionScopedConnection(dbBuilder);

        services.AddDbContext<SentinelContext>((sp, options) =>
        {
            options.UseNpgsql(dbBuilder.ToString(), npgsqlOptions =>
            {
                npgsqlOptions.EnableRetryOnFailure(database.RetryCount, TimeSpan.FromSeconds(5), null);
                npgsqlOptions.CommandTimeout(database.CommandTimeoutSeconds);
            });
            options.AddInterceptors(
                sp.GetRequiredService<TenantCommandInterceptor>(),
                sp.GetRequiredService<TenantConnectionInterceptor>());
        });

        return services;
    }

    private const int TransactionPoolingPort = 6543;

    private static void EnsureSessionScopedConnection(NpgsqlConnectionStringBuilder builder)
    {
        if (builder.Port != TransactionPoolingPort) return;

        throw new InvalidOperationException(
            $"The connection string targets port {TransactionPoolingPort}, reserved for transaction pooling mode. " +
            "Multi-tenant isolation relies on set_config('app.current_org', …) applied to the session: " +
            "in transaction mode, the physical connection changes between two transactions without the application being notified, " +
            "and a query may run under another customer's organization. Use port 5432 (session mode)");
    }

    private const string HangfireApplicationName = "sentinel-hangfire";
    private const int HangfireMaxPoolSize = 5;
    private const int HangfireKeepAliveSeconds = 30;
    private const int HangfireConnectionIdleLifetimeSeconds = 60;
    private const int HangfireWorkerCount = 2;
    private static readonly TimeSpan HangfireSchedulePollingInterval = TimeSpan.FromMinutes(1);

    public static IServiceCollection AddHangfireServices(this IServiceCollection services, IConfiguration configuration)
    {
        string connectionString = configuration.GetConnectionString(ConfigurationKeys.DefaultConnectionString)
            ?? throw new InvalidOperationException("The DefaultConnection connection string is missing");

        DatabaseSettings database = ReadSettings<DatabaseSettings>(configuration, ConfigurationKeys.Sections.Database);

        services.AddHangfire(config =>
        {
            config.UsePostgreSqlStorage(options =>
            {
                NpgsqlConnectionStringBuilder builder = new NpgsqlConnectionStringBuilder(connectionString)
                {
                    ApplicationName = HangfireApplicationName,
                    MaxPoolSize = HangfireMaxPoolSize,
                    CommandTimeout = database.CommandTimeoutSeconds,
                    ConnectionIdleLifetime = HangfireConnectionIdleLifetimeSeconds,
                    KeepAlive = HangfireKeepAliveSeconds,
                    TcpKeepAlive = true
                };
                options.UseNpgsqlConnection(builder.ToString());
            }, new PostgreSqlStorageOptions { PrepareSchemaIfNecessary = false });
        });

        services.AddHangfireServer(options =>
        {
            options.WorkerCount = HangfireWorkerCount;
            options.SchedulePollingInterval = HangfireSchedulePollingInterval;
        });

        return services;
    }

    public static IServiceCollection AddDataProtectionPolicy(this IServiceCollection services, IConfiguration configuration)
    {
        DataProtectionSettings settings = ReadSettings<DataProtectionSettings>(configuration, ConfigurationKeys.Sections.DataProtection);

        if (string.IsNullOrWhiteSpace(settings.CertBase64))
            throw new InvalidOperationException(
                "DataProtection:CertBase64 is required: without a certificate, the key ring is stored in clear text in the database, next to the data it encrypts");

        services.AddDataProtection()
            .SetApplicationName("Sentinel")
            .PersistKeysToDbContext<SentinelContext>()
            .ProtectKeysWithCertificate(LoadKeyRingCertificate(settings.CertBase64));

        return services;
    }

    private static X509Certificate2 LoadKeyRingCertificate(string certBase64)
    {
        byte[] pfxBytes;

        try
        {
            pfxBytes = Convert.FromBase64String(certBase64);
        }
        catch (FormatException exception)
        {
            throw new InvalidOperationException(
                "DataProtection:CertBase64 must contain a base64-encoded PKCS#12 certificate", exception);
        }

        X509Certificate2 certificate;

        try
        {
            certificate = X509CertificateLoader.LoadPkcs12(pfxBytes, null, X509KeyStorageFlags.DefaultKeySet);
        }
        catch (CryptographicException exception)
        {
            throw new InvalidOperationException(
                "DataProtection:CertBase64 is not a valid PKCS#12 certificate", exception);
        }

        if (!certificate.HasPrivateKey)
            throw new InvalidOperationException(
                "DataProtection:CertBase64 must contain the certificate private key, otherwise the key ring cannot be decrypted on restart");

        return certificate;
    }
}
