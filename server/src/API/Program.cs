using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Scalar.AspNetCore;
using Serilog;
using Serilog.AspNetCore;
using Sentinel.Infrastructure.Data;
using Sentinel.Infrastructure.Repositories;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.API.Extensions;
using Sentinel.API.Middleware;
using Sentinel.API.Realtime;
namespace Sentinel.API;

public static class Program
{
    private static readonly TimeSpan RegexMatchTimeout = TimeSpan.FromSeconds(2);
    private const long MemoryCacheSizeLimit = 50_000;
    private const string HealthPath = "/health";

    private const string PermissionsPolicy =
        "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()";

    private const string ContentSecurityPolicy =
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'";

    public static async Task Main(string[] args)
    {
        AppDomain.CurrentDomain.SetData("REGEX_DEFAULT_MATCH_TIMEOUT", RegexMatchTimeout);

        WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

        QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

        builder.Host.UseSerilog((context, services, configuration) => configuration
            .ReadFrom.Configuration(context.Configuration)
            .ReadFrom.Services(services)
            .Enrich.FromLogContext());

        builder.Services
            .AddSettings(builder.Configuration, builder.Environment)
            .AddTenantContext()
            .AddDatabase(builder.Configuration)
            .AddRepositories()
            .AddJwtAuthentication(builder.Configuration)
            .AddCorsPolicy(builder.Configuration)
            .AddHangfireServices(builder.Configuration)
            .AddHttpRegistryClients()
            .AddRealtimeServices()
            .AddHealthCheckServices()
            .AddApplicationServices()
            .AddInfrastructureServices()
            .AddUseCases()
            .AddSwaggerWithJwt()
            .AddControllersWithJsonOptions()
            .AddForwardedHeadersPolicy(builder.Configuration, builder.Environment)
            .AddLoginRateLimiting()
            .AddMemoryCache(options => options.SizeLimit = MemoryCacheSizeLimit)
            .AddResponseCompressionPolicy()
            .AddDataProtectionPolicy(builder.Configuration);

        WebApplication app = builder.Build();

        app.UseForwardedHeaders();

        if (!app.Environment.IsDevelopment())
        {
            app.UseHsts();
        }

        app.UseResponseCompression();
        app.UseMiddleware<CorrelationIdMiddleware>();
        app.UseSerilogRequestLogging(ConfigureRequestLogging);
        app.UseMiddleware<ErrorHandlingMiddleware>();
        app.UseMiddleware<ETagMiddleware>();
        app.UseRouting();
        app.Use(AppendSecurityHeadersAsync);

        await PrepareDatabaseAsync(app);

        if (app.Environment.IsDevelopment())
        {
            UseApiReference(app);
        }

        app.UseCors();
        app.UseAuthentication();
        app.UseMiddleware<ApiKeyMiddleware>();
        app.UseRateLimiter();
        app.UseMiddleware<DatabaseConnectionScopeMiddleware>();
        app.UseAuthorization();
        app.ConfigureHangfire();

        MapEndpoints(app);

        app.Run();
    }

    private static void ConfigureRequestLogging(RequestLoggingOptions options)
    {
        options.GetLevel = GetRequestLoggingLevel;

        options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
        {
            if (httpContext.Items.TryGetValue(CorrelationIdMiddleware.HeaderName, out object? correlationId)
                && correlationId?.ToString() is string correlationIdText
                && !string.IsNullOrEmpty(correlationIdText))
            {
                diagnosticContext.Set("CorrelationId", correlationIdText);
            }
        };
    }

    private static async Task AppendSecurityHeadersAsync(HttpContext context, Func<Task> next)
    {
        context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
        context.Response.Headers.Append("X-Frame-Options", "DENY");
        context.Response.Headers.Append("Referrer-Policy", "no-referrer");
        context.Response.Headers.Append("Permissions-Policy", PermissionsPolicy);
        context.Response.Headers.Append("Content-Security-Policy", ContentSecurityPolicy);

        await next();
    }

    private static async Task PrepareDatabaseAsync(WebApplication app)
    {
        using IServiceScope scope = app.Services.CreateScope();

        SentinelContext context = scope.ServiceProvider.GetRequiredService<SentinelContext>();
        ISystemScope systemScope = scope.ServiceProvider.GetRequiredService<ISystemScope>();

        using (systemScope.Enter())
        {
            await DatabaseSchemaMigrator.MigrateAsync(context, app.Configuration);

            if (!app.Environment.IsDevelopment())
            {
                await DatabaseRoleGuard.EnsureRowLevelSecurityAppliesAsync(context);
            }
        }

        if (app.Environment.IsDevelopment())
        {
            DataSeeder seeder = scope.ServiceProvider.GetRequiredService<DataSeeder>();
            await seeder.SeedAsync();
        }
    }

    private static void UseApiReference(WebApplication app)
    {
        app.UseSwagger();
        app.MapScalarApiReference(options =>
        {
            options.Title = "Sentinel API";
            options.Theme = ScalarTheme.DeepSpace;
            options.WithOpenApiRoutePattern("/swagger/{documentName}/swagger.json");
        });
    }

    private static void MapEndpoints(WebApplication app)
    {
        app.MapControllers();
        app.MapHealthChecks(HealthPath, new HealthCheckOptions
        {
            ResponseWriter = (context, report) =>
            {
                context.Response.ContentType = "text/plain";
                return context.Response.WriteAsync(report.Status.ToString());
            }
        }).AllowAnonymous();
        app.MapHub<SentinelHub>(RealtimeConstants.HubPath,
            options => options.CloseOnAuthenticationExpiration = true);
    }

    private static Serilog.Events.LogEventLevel GetRequestLoggingLevel(HttpContext httpContext, double elapsedMs, Exception? exception)
    {
        if (httpContext.RequestAborted.IsCancellationRequested)
        {
            return Serilog.Events.LogEventLevel.Debug;
        }

        bool isServerError = exception is not null || httpContext.Response.StatusCode > 499;
        if (isServerError)
        {
            return Serilog.Events.LogEventLevel.Error;
        }

        return httpContext.Request.Path.StartsWithSegments(HealthPath)
            ? Serilog.Events.LogEventLevel.Debug
            : Serilog.Events.LogEventLevel.Information;
    }
}
