using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using Serilog;
using Sentinel.Infrastructure.Data;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Settings;
using Sentinel.API.Extensions;
using Sentinel.API.HealthChecks;
using Sentinel.API.Middleware;
using Sentinel.Application.Services;
using Sentinel.API.Hubs;
namespace Sentinel.API;

public static class Program
{
    public static async Task Main(string[] args)
    {
        WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

        builder.Host.UseSerilog((context, services, configuration) => configuration
            .ReadFrom.Configuration(context.Configuration)
            .ReadFrom.Services(services)
            .Enrich.FromLogContext());

        string connectionString = builder.Configuration.GetConnectionString(ConfigurationKeys.DefaultConnectionString)
            ?? throw new InvalidOperationException("La chaîne de connexion DefaultConnection est manquante");

        builder.Services
            .AddSettings(builder.Configuration)
            .AddTenantContext()
            .AddDatabase(builder.Configuration)
            .AddJwtAuthentication(builder.Configuration)
            .AddCorsPolicy(builder.Configuration)
            .AddHangfireServices(connectionString)
            .AddHttpRegistryClients()
            .AddApplicationServices()
            .AddApiVersioningPolicy()
            .AddSwaggerWithJwt()
            .AddRequestValidation()
            .AddControllersWithJsonOptions()
            .AddLoginRateLimiting()
            .AddMemoryCache()
            .AddAppHealthChecks()
            .AddResponseCompressionPolicy()
            .AddOutputCachePolicy()
            .AddStripe(builder.Configuration)
            .AddDataProtectionPolicy(builder.Configuration.GetSection(ConfigurationKeys.Sections.DataProtection).Get<DataProtectionSettings>() ?? new());

        WebApplication app = builder.Build();

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
            await context.Database.MigrateAsync();

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
        app.UseRateLimiter();
        app.UseAuthentication();
        app.UseMiddleware<ApiKeyMiddleware>();
        app.UseAuthorization();
        app.UseOutputCache();
        app.ConfigureHangfire();

        app.MapHealthChecks(HealthCheckConstants.LivePath, new HealthCheckOptions
        {
            Predicate = _ => false,
            ResponseWriter = HealthCheckResponseWriter.WriteResponse
        });

        app.MapHealthChecks(HealthCheckConstants.ReadyPath, new HealthCheckOptions
        {
            Predicate = c => c.Tags.Contains(HealthCheckConstants.ReadyTag),
            ResponseWriter = HealthCheckResponseWriter.WriteResponse
        });

        app.MapControllers();
        app.MapHub<NotificationHub>("/hubs/notifications");

        app.Run();
    }
}
