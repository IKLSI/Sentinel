using System.IdentityModel.Tokens.Jwt;
using System.IO.Compression;
using System.Net;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Asp.Versioning;
using FluentValidation;
using Hangfire;
using Hangfire.PostgreSql;
using Npgsql;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.SignalR;
using Sentinel.API.Hubs;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Settings;
using Sentinel.Infrastructure.Data;
using Sentinel.API.Filters;
using Sentinel.API.Http;
using Sentinel.API.HealthChecks;
using Sentinel.API.Jobs;
using Sentinel.API.Services;
using Sentinel.Application.Services;
using Sentinel.Application.Validators;

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

    public static IServiceCollection AddSettings(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<JwtSettings>(configuration.GetSection(ConfigurationKeys.Sections.Jwt));
        services.Configure<EmailSettings>(configuration.GetSection(ConfigurationKeys.Sections.Email));
        services.Configure<FrontendSettings>(configuration.GetSection(ConfigurationKeys.Sections.Frontend));
        services.Configure<CorsSettings>(configuration.GetSection(ConfigurationKeys.Sections.Cors));
        services.Configure<StripeSettings>(configuration.GetSection(ConfigurationKeys.Sections.Stripe));
        services.Configure<EncryptionSettings>(configuration.GetSection(ConfigurationKeys.Sections.Encryption));
        services.Configure<SupportSettings>(configuration.GetSection(ConfigurationKeys.Sections.Support));
        services.Configure<DataProtectionSettings>(configuration.GetSection(ConfigurationKeys.Sections.DataProtection));
        services.Configure<CookieSettings>(configuration.GetSection(ConfigurationKeys.Sections.Cookie));

        return services;
    }

    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        IConfigurationSection jwtSettings = configuration.GetSection(ConfigurationKeys.Sections.Jwt);

        string jwtSecret = jwtSettings[ConfigurationKeys.JwtKeys.Secret]
            ?? throw new InvalidOperationException("La clé JWT est manquante dans la configuration");

        if (Encoding.UTF8.GetByteCount(jwtSecret) < 32)
            throw new InvalidOperationException("La clé JWT doit contenir au moins 256 bits (32 octets UTF-8)");

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwtSettings[ConfigurationKeys.JwtKeys.Issuer],
                    ValidateAudience = true,
                    ValidAudience = jwtSettings[ConfigurationKeys.JwtKeys.Audience],
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
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

        string[]? configured = configuration.GetSection(ConfigurationKeys.CorsAllowedOrigins).Get<string[]>();

        if (configured != null)
        {
            foreach (string origin in configured)
            {
                if (IsValidOrigin(origin))
                {
                    origins.Add(origin.TrimEnd('/'));
                }
            }
        }

        string? frontendUrl = configuration[ConfigurationKeys.FrontendBaseUrl];

        if (IsValidOrigin(frontendUrl))
        {
            origins.Add(frontendUrl!.TrimEnd('/'));
        }

        if (origins.Count == 0)
        {
            origins.Add("http://localhost:3000");
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
        services.AddScoped<AuthService>();
        services.AddScoped<TicketService>();
        services.AddScoped<ExportService>();
        services.AddScoped<RepositoryHostClient>();
        services.AddScoped<ManifestParserService>();
        services.AddScoped<ManifestPatcherService>();
        services.AddScoped<DependencyRegistryClient>();
        services.AddScoped<RepositoryScannerService>();
        services.AddScoped<RemediationService>();
        services.AddScoped<TechHealthService>();
        services.AddScoped<DashboardService>();
        services.AddScoped<DataSeeder>();
        services.AddScoped<TokenProtector>();
        services.AddScoped<QuotaService>();
        services.AddScoped<BillingService>();
        services.AddScoped<ApiKeyService>();

        services.AddSingleton<ITokenBlacklistService, TokenBlacklistService>();

        services.AddTransient<TechHealthScanJob>();
        services.AddTransient<SendInvitationEmailJob>();
        services.AddTransient<SendPasswordResetEmailJob>();
        services.AddTransient<SendEmailVerificationJob>();

        services.AddSingleton<IEmailService, EmailService>();
        services.AddScoped<INotificationService, NotificationService>();

        services.AddSignalR();
        services.AddSingleton<IUserIdProvider, NotificationUserIdProvider>();
        services.AddScoped<INotificationPusher, SignalRNotificationPusher>();

        return services;
    }

    public static IServiceCollection AddStripe(this IServiceCollection services, IConfiguration configuration)
    {
        string apiKey = configuration[ConfigurationKeys.StripeSecretKey] ?? string.Empty;

        if (string.IsNullOrEmpty(apiKey)) apiKey = "sk_test_placeholder";

        services.AddSingleton<Stripe.IStripeClient>(new Stripe.StripeClient(apiKey));

        return services;
    }

    public static IServiceCollection AddDataProtectionPolicy(this IServiceCollection services, DataProtectionSettings settings)
    {
        IDataProtectionBuilder dp = services.AddDataProtection()
            .SetApplicationName("Sentinel")
            .PersistKeysToDbContext<SentinelContext>();

        if (!string.IsNullOrWhiteSpace(settings.CertBase64))
        {
            byte[] pfxBytes = Convert.FromBase64String(settings.CertBase64);
            System.Security.Cryptography.X509Certificates.X509Certificate2 cert =
                System.Security.Cryptography.X509Certificates.X509CertificateLoader.LoadPkcs12(
                    pfxBytes, null, System.Security.Cryptography.X509Certificates.X509KeyStorageFlags.DefaultKeySet);

            dp.ProtectKeysWithCertificate(cert);
        }

        return services;
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
        services.AddControllers(options =>
        {
            options.Filters.Add<ValidationFilter>();
        }).AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
            options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        });

        services.Configure<ApiBehaviorOptions>(options =>
        {
            options.InvalidModelStateResponseFactory = ctx =>
            {
                Dictionary<string, string[]> errors = ctx.ModelState
                    .Where(kv => kv.Value != null && kv.Value.Errors.Count > 0)
                    .ToDictionary(
                        kv => ToCamelCase(kv.Key),
                        kv => kv.Value!.Errors.Select(e => string.IsNullOrEmpty(e.ErrorMessage) ? "Valeur invalide" : e.ErrorMessage).ToArray());

                ValidationProblemDetails problem = new ValidationProblemDetails(errors)
                {
                    Status = StatusCodes.Status400BadRequest,
                    Title = "Validation échouée",
                    Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1",
                    Instance = ctx.HttpContext.Request.Path
                };

                return new BadRequestObjectResult(problem);
            };
        });

        return services;
    }

    public static IServiceCollection AddRequestValidation(this IServiceCollection services)
    {
        services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>();
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

    public static IServiceCollection AddAppHealthChecks(this IServiceCollection services)
    {
        services.AddHealthChecks()
            .AddCheck<PostgresHealthCheck>(HealthCheckConstants.PostgresName, tags: new[] { HealthCheckConstants.ReadyTag });

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
        ForwardedHeadersSettings settings = configuration
            .GetSection(ConfigurationKeys.Sections.ForwardedHeaders)
            .Get<ForwardedHeadersSettings>() ?? new ForwardedHeadersSettings();

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
                    new { message = "Trop de requêtes. Veuillez réessayer plus tard." },
                    cancellationToken);
            };
        });

        return services;
    }
}
