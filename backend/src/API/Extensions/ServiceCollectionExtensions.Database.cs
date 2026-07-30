using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Settings;
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

        NpgsqlConnectionStringBuilder dbBuilder = new NpgsqlConnectionStringBuilder(connectionString)
        {
            MaxPoolSize = 50
        };

        services.AddDbContext<SentinelContext>((sp, options) =>
        {
            options.UseNpgsql(dbBuilder.ToString(), npgsqlOptions =>
            {
                npgsqlOptions.EnableRetryOnFailure(3, TimeSpan.FromSeconds(5), null);
                npgsqlOptions.CommandTimeout(30);
            });
            options.AddInterceptors(
                sp.GetRequiredService<TenantCommandInterceptor>(),
                sp.GetRequiredService<TenantConnectionInterceptor>());
        });

        return services;
    }

    public static IServiceCollection AddHangfireServices(this IServiceCollection services, string connectionString)
    {
        services.AddHangfire(config =>
        {
            config.UsePostgreSqlStorage(options =>
            {
                NpgsqlConnectionStringBuilder builder = new NpgsqlConnectionStringBuilder(connectionString)
                {
                    KeepAlive = 30,
                    TcpKeepAlive = true
                };
                options.UseNpgsqlConnection(builder.ToString());
            });
        });

        services.AddHangfireServer(options =>
        {
            options.WorkerCount = 2;
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
