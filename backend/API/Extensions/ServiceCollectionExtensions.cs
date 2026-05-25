using System.IdentityModel.Tokens.Jwt;
using System.IO.Compression;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Asp.Versioning;
using FluentValidation;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Sentinel.Domain.Abstractions;
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
        string connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("La chaîne de connexion DefaultConnection est manquante");

        services.AddScoped<TenantCommandInterceptor>();

        services.AddDbContext<SentinelContext>((sp, options) =>
        {
            options.UseNpgsql(connectionString, npgsqlOptions =>
            {
                npgsqlOptions.EnableRetryOnFailure(3, TimeSpan.FromSeconds(5), null);
                npgsqlOptions.CommandTimeout(30);
            });
            options.AddInterceptors(sp.GetRequiredService<TenantCommandInterceptor>());
        });

        return services;
    }

    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        IConfigurationSection jwtSettings = configuration.GetSection("Jwt");
        string jwtSecret = jwtSettings["Secret"]
            ?? throw new InvalidOperationException("La clé JWT est manquante dans la configuration");

        if (Encoding.UTF8.GetByteCount(jwtSecret) < 32)
            throw new InvalidOperationException("La clé JWT doit contenir au moins 256 bits (32 octets UTF-8)");

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwtSettings["Issuer"],
                    ValidateAudience = true,
                    ValidAudience = jwtSettings["Audience"],
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };

                options.Events = new JwtBearerEvents
                {
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

                        string? userIdClaim = context.Principal?.FindFirst("userId")?.Value;
                        string? versionClaim = context.Principal?.FindFirst("tokenVersion")?.Value;
                        if (!Guid.TryParse(userIdClaim, out Guid userId) || !int.TryParse(versionClaim, out int tokenVersion))
                        {
                            context.Fail("Token invalide");
                            return;
                        }

                        SentinelContext db = sp.GetRequiredService<SentinelContext>();
                        ISystemScope systemScope = sp.GetRequiredService<ISystemScope>();
                        using IDisposable elevation = systemScope.Enter();

                        var account = await db.Users
                            .Where(u => u.Id == userId)
                            .Select(u => new { u.IsActive, u.TokenVersion })
                            .FirstOrDefaultAsync();

                        if (account == null || !account.IsActive || account.TokenVersion != tokenVersion)
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

        string[]? configured = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
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

        string? frontendUrl = configuration["Frontend:BaseUrl"];
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
                options.UseNpgsqlConnection(connectionString);
            });
        });
        services.AddHangfireServer(options =>
        {
            options.WorkerCount = 5;
        });
        return services;
    }

    public static IServiceCollection AddHttpRegistryClients(this IServiceCollection services)
    {
        services.AddTransient<ResilientHttpHandler>();

        services.AddHttpClient("OSV", client =>
        {
            client.BaseAddress = new Uri("https://api.osv.dev");
            client.DefaultRequestHeaders.Add("Accept", "application/json");
            client.Timeout = TimeSpan.FromSeconds(90);
        }).AddHttpMessageHandler<ResilientHttpHandler>();

        services.AddHttpClient("Registry", client =>
        {
            client.DefaultRequestHeaders.Add("User-Agent", "Sentinel-Scanner/1.0");
            client.Timeout = TimeSpan.FromSeconds(90);
        }).AddHttpMessageHandler<ResilientHttpHandler>();

        services.AddHttpClient("EolDate", client =>
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
        services.AddScoped<TimeTrackingService>();
        services.AddScoped<RepositoryHostClient>();
        services.AddScoped<ManifestParserService>();
        services.AddScoped<DependencyRegistryClient>();
        services.AddScoped<RepositoryScannerService>();
        services.AddScoped<TechHealthService>();
        services.AddScoped<DashboardService>();
        services.AddScoped<DataSeeder>();
        services.AddScoped<TokenProtector>();

        services.AddSingleton<ITokenBlacklistService, TokenBlacklistService>();

        services.AddTransient<TechHealthScanJob>();
        services.AddTransient<SendInvitationEmailJob>();
        services.AddTransient<SendPasswordResetEmailJob>();

        services.AddSingleton<IEmailService, EmailService>();
        services.AddScoped<INotificationService, NotificationService>();

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
                new HeaderApiVersionReader("X-Api-Version"),
                new QueryStringApiVersionReader("api-version"));
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
            .AddCheck<PostgresHealthCheck>("postgres", tags: new[] { "ready" });
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
                .Tag("default"));

            options.AddPolicy("StatusesCache", builder => builder
                .Expire(TimeSpan.FromMinutes(5))
                .SetVaryByHeader("Authorization")
                .Tag("statuses"));

            options.AddPolicy("DashboardCache", builder => builder
                .Expire(TimeSpan.FromSeconds(60))
                .SetVaryByHeader("Authorization")
                .Tag("dashboard"));
        });

        return services;
    }

    public static IServiceCollection AddLoginRateLimiting(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.AddPolicy("login", httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 5,
                        Window = TimeSpan.FromMinutes(15),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0
                    }));

            options.AddPolicy("password-reset", httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 3,
                        Window = TimeSpan.FromMinutes(60),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0
                    }));

            options.AddPolicy("invitation", httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 10,
                        Window = TimeSpan.FromMinutes(15),
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
