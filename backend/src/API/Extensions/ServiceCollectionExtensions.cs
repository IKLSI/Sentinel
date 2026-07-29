using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.IO.Compression;
using System.Net;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Asp.Versioning;
using Hangfire;
using Hangfire.PostgreSql;
using Npgsql;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.SignalR;
using Sentinel.API.Hubs;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Common;
using Sentinel.Domain.Settings;
using Sentinel.Infrastructure.Data;
using Sentinel.Infrastructure.Email;
using Sentinel.Infrastructure.Http;
using Sentinel.API.Http;
using Sentinel.API.Services;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Billing;
using Sentinel.Application.Dashboard;
using Sentinel.Application.Jobs;
using Sentinel.Application.Notifications;
using Sentinel.Application.Audit;
using Sentinel.Application.Exports;
using Sentinel.Application.Security;
using Sentinel.Application.TechHealth;
using Sentinel.Application.TechHealth.ComplianceReport;
using Sentinel.Application.TechHealth.ExportSbom;
using Sentinel.Application.TechHealth.Scan;
using Sentinel.Application.Remediation;

namespace Sentinel.API.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddDatabase(this IServiceCollection services, IConfiguration configuration)
    {
        string connectionString = configuration.GetConnectionString(ConfigurationKeys.DefaultConnectionString)
            ?? throw new InvalidOperationException("La chaîne de connexion DefaultConnection est manquante");

        services.AddScoped<TenantCommandInterceptor>();

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
            options.AddInterceptors(sp.GetRequiredService<TenantCommandInterceptor>());
        });

        return services;
    }

    public static IServiceCollection AddSettings(this IServiceCollection services, IConfiguration configuration, IHostEnvironment environment)
    {
        bool validateDeploymentSettings = !environment.IsDevelopment();

        services.BindSettings<JwtSettings>(configuration, ConfigurationKeys.Sections.Jwt, true);
        services.BindSettings<EmailSettings>(configuration, ConfigurationKeys.Sections.Email, validateDeploymentSettings);
        services.BindSettings<FrontendSettings>(configuration, ConfigurationKeys.Sections.Frontend, validateDeploymentSettings);
        services.BindSettings<StripeSettings>(configuration, ConfigurationKeys.Sections.Stripe, validateDeploymentSettings);
        services.BindSettings<SupportSettings>(configuration, ConfigurationKeys.Sections.Support, false);
        services.BindSettings<CorsSettings>(configuration, ConfigurationKeys.Sections.Cors, false);
        services.BindSettings<DataProtectionSettings>(configuration, ConfigurationKeys.Sections.DataProtection, false);
        services.BindSettings<CookieSettings>(configuration, ConfigurationKeys.Sections.Cookie, false);

        services.AddOptions<SupportSettings>()
            .Validate(settings => string.IsNullOrWhiteSpace(settings.Email) || new EmailAddressAttribute().IsValid(settings.Email),
                "Support:Email doit être une adresse email valide lorsqu'elle est renseignée")
            .ValidateOnStart();

        if (validateDeploymentSettings)
        {
            services.AddOptions<FrontendSettings>()
                .Validate(settings => !IsLoopbackUrl(settings.BaseUrl),
                    "Frontend:BaseUrl doit être renseigné hors développement : l'URL de repli localhost casserait les liens des emails");
        }

        return services;
    }

    private static bool IsLoopbackUrl(string value)
        => Uri.TryCreate(value, UriKind.Absolute, out Uri? uri) && uri.IsLoopback;

    private static IServiceCollection BindSettings<TSettings>(this IServiceCollection services, IConfiguration configuration, string section, bool validate)
        where TSettings : class
    {
        OptionsBuilder<TSettings> builder = services
            .AddOptions<TSettings>()
            .Bind(configuration.GetSection(section));

        if (validate)
        {
            builder.ValidateDataAnnotations().ValidateOnStart();
        }

        return services;
    }

    private static TSettings ReadSettings<TSettings>(IConfiguration configuration, string section)
        where TSettings : class, new()
        => configuration.GetSection(section).Get<TSettings>() ?? new TSettings();

    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        JwtSettings jwt = ReadSettings<JwtSettings>(configuration, ConfigurationKeys.Sections.Jwt);

        if (string.IsNullOrWhiteSpace(jwt.Secret))
            throw new InvalidOperationException("La clé JWT est manquante dans la configuration");

        if (Encoding.UTF8.GetByteCount(jwt.Secret) < 32)
            throw new InvalidOperationException("La clé JWT doit contenir au moins 256 bits (32 octets UTF-8)");

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwt.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwt.Audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Secret)),
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };

                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        string? accessToken = context.Request.Query["access_token"];
                        PathString path = context.HttpContext.Request.Path;

                        if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/notifications"))
                            context.Token = accessToken;

                        return Task.CompletedTask;
                    },
                    OnTokenValidated = async context =>
                    {
                        IServiceProvider sp = context.HttpContext.RequestServices;

                        ITokenBlacklistService? blacklist = sp.GetService<ITokenBlacklistService>();
                        string? jti = context.Principal?.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;

                        if (blacklist != null && !string.IsNullOrEmpty(jti) && blacklist.IsRevoked(jti))
                        {
                            context.Fail("Token révoqué");
                            return;
                        }

                        string? userIdClaim = context.Principal?.FindFirst(ClaimNames.UserId)?.Value;
                        string? versionClaim = context.Principal?.FindFirst(ClaimNames.TokenVersion)?.Value;

                        if (!Guid.TryParse(userIdClaim, out Guid userId) || !int.TryParse(versionClaim, out int tokenVersion))
                        {
                            context.Fail("Token invalide");
                            return;
                        }

                        IMemoryCache cache = sp.GetRequiredService<IMemoryCache>();
                        string cacheKey = CacheKeys.AuthAccount(userId);

                        if (!cache.TryGetValue(cacheKey, out (bool IsActive, int TokenVersion) account))
                        {
                            SentinelContext db = sp.GetRequiredService<SentinelContext>();
                            ISystemScope systemScope = sp.GetRequiredService<ISystemScope>();

                            using IDisposable elevation = systemScope.Enter();

                            var found = await db.Users
                                .Where(u => u.Id == userId)
                                .Select(u => new { u.IsActive, u.TokenVersion })
                                .FirstOrDefaultAsync();

                            if (found == null)
                            {
                                context.Fail("Session expirée");
                                return;
                            }

                            account = (found.IsActive, found.TokenVersion);
                            cache.Set(cacheKey, account, CacheKeys.AuthAccountTtl);
                        }

                        if (!account.IsActive || account.TokenVersion != tokenVersion)
                        {
                            context.Fail("Session expirée");
                        }
                    }
                };
            });

        services.AddAuthorization();
        return services;
    }

    public static IServiceCollection AddCorsPolicy(this IServiceCollection services, IConfiguration configuration)
    {
        string[] origins = ResolveAllowedOrigins(configuration);

        services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy =>
            {
                policy
                    .WithOrigins(origins)
                    .WithHeaders("Authorization", "Content-Type", "Accept", "X-Requested-With")
                    .WithMethods("GET", "POST", "PUT", "PATCH", "DELETE")
                    .AllowCredentials();
            });
        });

        return services;
    }

    private static string[] ResolveAllowedOrigins(IConfiguration configuration)
    {
        HashSet<string> origins = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        CorsSettings cors = ReadSettings<CorsSettings>(configuration, ConfigurationKeys.Sections.Cors);

        foreach (string origin in cors.AllowedOrigins)
        {
            if (IsValidOrigin(origin))
            {
                origins.Add(origin.TrimEnd('/'));
            }
        }

        FrontendSettings frontend = ReadSettings<FrontendSettings>(configuration, ConfigurationKeys.Sections.Frontend);

        if (IsValidOrigin(frontend.BaseUrl))
        {
            origins.Add(frontend.BaseUrl.TrimEnd('/'));
        }

        if (origins.Count == 0)
        {
            origins.Add(FrontendSettings.DefaultBaseUrl);
        }

        return origins.ToArray();
    }

    private static bool IsValidOrigin(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return false;
        if (!Uri.TryCreate(value, UriKind.Absolute, out Uri? uri)) return false;

        return uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps;
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

    public static IServiceCollection AddHttpRegistryClients(this IServiceCollection services)
    {
        services.AddTransient<ResilientHttpHandler>();

        services.AddHttpClient(HttpClientNames.Osv, client =>
        {
            client.BaseAddress = new Uri("https://api.osv.dev");
            client.DefaultRequestHeaders.Add("Accept", "application/json");
            client.Timeout = TimeSpan.FromSeconds(90);
        }).AddHttpMessageHandler<ResilientHttpHandler>();

        services.AddHttpClient(HttpClientNames.Registry, client =>
        {
            client.DefaultRequestHeaders.Add("User-Agent", "Sentinel-Scanner/1.0");
            client.Timeout = TimeSpan.FromSeconds(90);
        }).AddHttpMessageHandler<ResilientHttpHandler>();

        services.AddHttpClient(HttpClientNames.EolDate, client =>
        {
            client.DefaultRequestHeaders.Add("Accept", "application/json");
            client.Timeout = TimeSpan.FromSeconds(45);
        }).AddHttpMessageHandler<ResilientHttpHandler>();

        return services;
    }

    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddSingleton<AuditLogQueue>();
        services.AddScoped<IAuditLogService, AuditLogService>();
        services.AddHostedService<AuditLogBackgroundWriter>();
        services.AddScoped<TokenService>();
        services.AddScoped<ExportService>();
        services.AddScoped<NotificationPublisher>();
        services.AddScoped<DashboardCache>();
        services.AddScoped<IRepositoryHostClient, RepositoryHostClient>();
        services.AddScoped<ManifestParserService>();
        services.AddScoped<ManifestPatcherService>();
        services.AddScoped<IDependencyRegistryClient, DependencyRegistryClient>();
        services.AddScoped<RepositoryScannerService>();
        services.AddScoped<RemediationService>();
        services.AddScoped<TechHealthService>();
        services.AddScoped<SbomService>();
        services.AddScoped<ComplianceReportService>();
        services.AddScoped<QuotaGuard>();
        services.AddScoped<DataSeeder>();
        services.AddScoped<TokenProtector>();
        services.AddScoped<StripePriceCatalog>();
        services.AddScoped<StripeCustomerProvisioner>();

        services.AddSingleton<ITokenBlacklistService, TokenBlacklistService>();

        services.AddTransient<TechHealthScanJob>();
        services.AddTransient<SendInvitationEmailJob>();
        services.AddTransient<SendPasswordResetEmailJob>();
        services.AddTransient<SendEmailVerificationJob>();

        services.AddSingleton<IEmailService, EmailService>();

        services.AddSignalR();
        services.AddSingleton<IUserIdProvider, NotificationUserIdProvider>();
        services.AddScoped<INotificationPusher, SignalRNotificationPusher>();

        return services;
    }

    public static IServiceCollection AddUseCases(this IServiceCollection services)
    {
        IEnumerable<Type> useCaseTypes = typeof(IService).Assembly
            .GetTypes()
            .Where(type => type is { IsClass: true, IsAbstract: false }
                && (typeof(IService).IsAssignableFrom(type) || typeof(IValidator).IsAssignableFrom(type)));

        foreach (Type useCaseType in useCaseTypes)
        {
            services.AddScoped(useCaseType);
        }

        return services;
    }

    public static IServiceCollection AddStripe(this IServiceCollection services, IConfiguration configuration)
    {
        StripeSettings stripe = ReadSettings<StripeSettings>(configuration, ConfigurationKeys.Sections.Stripe);

        string apiKey = string.IsNullOrEmpty(stripe.SecretKey) ? "sk_test_placeholder" : stripe.SecretKey;

        services.AddSingleton<Stripe.IStripeClient>(new Stripe.StripeClient(apiKey));

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

    public static IServiceCollection AddSwaggerWithJwt(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Sentinel API",
                Version = "v1",
                Description = "API de gestion TMA (Tierce Maintenance Applicative)"
            });

            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.ApiKey,
                Scheme = "Bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "Entrez 'Bearer' suivi d'un espace et de votre token JWT"
            });

            options.AddSecurityRequirement(doc => new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecuritySchemeReference("Bearer", doc),
                    new List<string>()
                }
            });
        });

        return services;
    }

    public static IServiceCollection AddControllersWithJsonOptions(this IServiceCollection services)
    {
        services.AddControllers().AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
            options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        });

        services.Configure<ApiBehaviorOptions>(options =>
        {
            options.InvalidModelStateResponseFactory = ctx =>
            {
                Dictionary<string, ValidationErrorItem[]> errors = ctx.ModelState
                    .Where(kv => kv.Value != null && kv.Value.Errors.Count > 0)
                    .ToDictionary(
                        kv => ToCamelCase(kv.Key),
                        kv => kv.Value!.Errors
                            .Select(_ => new ValidationErrorItem { Code = ValidationCodes.InvalidValue })
                            .ToArray());

                return new BadRequestObjectResult(new ApiValidationErrorResponse
                {
                    Code = ErrorCodes.ValidationFailed,
                    Status = StatusCodes.Status400BadRequest,
                    Errors = errors
                });
            };
        });

        return services;
    }

    public static IServiceCollection AddApiVersioningPolicy(this IServiceCollection services)
    {
        services.AddApiVersioning(options =>
        {
            options.DefaultApiVersion = new ApiVersion(1, 0);
            options.AssumeDefaultVersionWhenUnspecified = true;
            options.ReportApiVersions = true;
            options.ApiVersionReader = ApiVersionReader.Combine(
                new UrlSegmentApiVersionReader(),
                new HeaderApiVersionReader(CustomHeaderNames.ApiVersion),
                new QueryStringApiVersionReader(CustomHeaderNames.ApiVersionQuery));
        }).AddApiExplorer(options =>
        {
            options.GroupNameFormat = "'v'VVV";
            options.SubstituteApiVersionInUrl = true;
        });

        return services;
    }

    private static string ToCamelCase(string name)
    {
        if (string.IsNullOrEmpty(name)) return name;
        if (char.IsLower(name[0])) return name;

        return string.Create(name.Length, name, static (span, source) =>
        {
            source.AsSpan().CopyTo(span);
            span[0] = char.ToLowerInvariant(span[0]);
        });
    }

    public static IServiceCollection AddTenantContext(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<ITenantContext, TenantContext>();
        services.AddSingleton<ISystemScope, SystemScope>();
        services.AddSingleton<IContentPathProvider, ContentPathProvider>();
        services.AddScoped<IRefreshTokenStore, RefreshTokenCookie>();

        return services;
    }

    public static IServiceCollection AddResponseCompressionPolicy(this IServiceCollection services)
    {
        services.AddResponseCompression(options =>
        {
            options.EnableForHttps = true;
            options.Providers.Add<BrotliCompressionProvider>();
            options.Providers.Add<GzipCompressionProvider>();
            options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(new[]
            {
                "application/json",
                "application/javascript",
                "text/json",
                "text/css"
            });
        });

        services.Configure<BrotliCompressionProviderOptions>(opts => opts.Level = CompressionLevel.Fastest);
        services.Configure<GzipCompressionProviderOptions>(opts => opts.Level = CompressionLevel.Fastest);

        return services;
    }

    public static IServiceCollection AddOutputCachePolicy(this IServiceCollection services)
    {
        services.AddOutputCache(options =>
        {
            options.AddBasePolicy(builder => builder
                .Expire(TimeSpan.FromSeconds(30))
                .SetVaryByHeader("Authorization", "Accept-Language")
                .Tag(OutputCacheTags.Default));

            options.AddPolicy(OutputCachePolicies.Statuses, builder => builder
                .Expire(TimeSpan.FromMinutes(5))
                .SetVaryByHeader("Authorization")
                .Tag(OutputCacheTags.Statuses));

            options.AddPolicy(OutputCachePolicies.Dashboard, builder => builder
                .Expire(TimeSpan.FromSeconds(60))
                .SetVaryByHeader("Authorization")
                .Tag(OutputCacheTags.Dashboard));
        });

        return services;
    }

    public static IServiceCollection AddForwardedHeadersPolicy(this IServiceCollection services, IConfiguration configuration)
    {
        ForwardedHeadersSettings settings = ReadSettings<ForwardedHeadersSettings>(configuration, ConfigurationKeys.Sections.ForwardedHeaders);

        services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
            options.ForwardLimit = settings.ForwardLimit;
            options.KnownProxies.Clear();
            options.KnownIPNetworks.Clear();

            foreach (string proxy in settings.KnownProxies)
            {
                if (IPAddress.TryParse(proxy, out IPAddress? address))
                    options.KnownProxies.Add(address);
            }

            foreach (string network in settings.KnownNetworks)
            {
                if (System.Net.IPNetwork.TryParse(network, out System.Net.IPNetwork parsed))
                    options.KnownIPNetworks.Add(parsed);
            }
        });

        return services;
    }

    public static IServiceCollection AddLoginRateLimiting(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.AddPolicy(RateLimitPolicies.Login, httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 5,
                        Window = TimeSpan.FromMinutes(15),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0
                    }));

            options.AddPolicy(RateLimitPolicies.Refresh, httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 30,
                        Window = TimeSpan.FromMinutes(15),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0
                    }));

            options.AddPolicy(RateLimitPolicies.PasswordReset, httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 3,
                        Window = TimeSpan.FromMinutes(60),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0
                    }));

            options.AddPolicy(RateLimitPolicies.Invitation, httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 10,
                        Window = TimeSpan.FromMinutes(15),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0
                    }));

            options.AddPolicy(RateLimitPolicies.Register, httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 5,
                        Window = TimeSpan.FromMinutes(60),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0
                    }));

            options.AddPolicy(RateLimitPolicies.Scan, httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: httpContext.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                        ?? httpContext.Connection.RemoteIpAddress?.ToString()
                        ?? "unknown",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 10,
                        Window = TimeSpan.FromMinutes(1),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0
                    }));

            options.OnRejected = async (context, cancellationToken) =>
            {
                context.HttpContext.Response.StatusCode = 429;
                context.HttpContext.Response.ContentType = "application/json";
                await context.HttpContext.Response.WriteAsJsonAsync(
                    ApiErrorResponse.Create(ErrorCodes.TooManyRequests, StatusCodes.Status429TooManyRequests),
                    cancellationToken);
            };
        });

        return services;
    }
}
