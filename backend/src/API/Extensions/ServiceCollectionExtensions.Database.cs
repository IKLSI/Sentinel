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
            ?? throw new InvalidOperationException("La chaîne de connexion DefaultConnection est manquante");

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
                "DataProtection:CertBase64 est requis : sans certificat, le trousseau de clés est écrit en clair dans la base, à côté des données qu'il chiffre");

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
                "DataProtection:CertBase64 doit contenir un certificat PKCS#12 encodé en base64", exception);
        }

        X509Certificate2 certificate;

        try
        {
            certificate = X509CertificateLoader.LoadPkcs12(pfxBytes, null, X509KeyStorageFlags.DefaultKeySet);
        }
        catch (CryptographicException exception)
        {
            throw new InvalidOperationException(
                "DataProtection:CertBase64 n'est pas un certificat PKCS#12 valide", exception);
        }

        if (!certificate.HasPrivateKey)
            throw new InvalidOperationException(
                "DataProtection:CertBase64 doit contenir la clé privée du certificat, sinon le trousseau ne peut pas être déchiffré au redémarrage");

        return certificate;
    }
}
