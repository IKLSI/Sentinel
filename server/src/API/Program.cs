using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using Serilog;
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
            .AddApplicationServices()
            .AddInfrastructureServices()
            .AddUseCases()
            .AddSwaggerWithJwt()
            .AddControllersWithJsonOptions()
            .AddForwardedHeadersPolicy(builder.Configuration, builder.Environment)
            .AddLoginRateLimiting()
            .AddMemoryCache(options => options.SizeLimit = 50_000)
            .AddResponseCompressionPolicy()
            // .AddStripe(builder.Configuration) // Stripe désactivé temporairement
            .AddDataProtectionPolicy(builder.Configuration);

        WebApplication app = builder.Build();

        app.UseForwardedHeaders();

        if (!app.Environment.IsDevelopment())
        {
            app.UseHsts();
        }

        app.UseResponseCompression();
        app.UseMiddleware<CorrelationIdMiddleware>();
        app.UseMiddleware<ErrorHandlingMiddleware>();
        app.UseMiddleware<ETagMiddleware>();
        app.UseSerilogRequestLogging(options =>
        {
            options.GetLevel = GetRequestLoggingLevel;

            options.EnrichDiagnosticContext = (diagCtx, httpCtx) =>
            {
                if (httpCtx.Items.TryGetValue(CorrelationIdMiddleware.HeaderName, out object? cid)
                    && cid?.ToString() is string cidStr
                    && !string.IsNullOrEmpty(cidStr))
                {
                    diagCtx.Set("CorrelationId", cidStr);
                }
            };
        });
        app.UseRouting();

        app.Use(async (context, next) =>
        {
            context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
            context.Response.Headers.Append("X-Frame-Options", "DENY");
            context.Response.Headers.Append("Referrer-Policy", "no-referrer");
            context.Response.Headers.Append("Permissions-Policy", "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()");
            context.Response.Headers.Append("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'");

            await next();
        });

        using (IServiceScope scope = app.Services.CreateScope())
        {
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

        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.MapScalarApiReference(options =>
            {
                options.Title = "Sentinel API";
                options.Theme = ScalarTheme.DeepSpace;
                options.WithOpenApiRoutePattern("/swagger/{documentName}/swagger.json");
            });
        }

        app.UseStaticFiles();
        app.UseCors();
        app.UseAuthentication();
        app.UseRateLimiter();
        app.UseMiddleware<ApiKeyMiddleware>();
        app.UseMiddleware<DatabaseConnectionScopeMiddleware>();
        app.UseAuthorization();
        app.ConfigureHangfire();

        app.MapControllers();
        app.MapHub<SentinelHub>(RealtimeConstants.HubPath,
            options => options.CloseOnAuthenticationExpiration = true);

        app.Run();
    }

    private static Serilog.Events.LogEventLevel GetRequestLoggingLevel(HttpContext httpContext, double elapsedMs, Exception? exception)
    {
        bool isClientCancellation = exception is OperationCanceledException && httpContext.RequestAborted.IsCancellationRequested;
        if (isClientCancellation)
        {
            return Serilog.Events.LogEventLevel.Debug;
        }

        bool isServerError = exception is not null || httpContext.Response.StatusCode > 499;
        return isServerError ? Serilog.Events.LogEventLevel.Error : Serilog.Events.LogEventLevel.Information;
    }
}
