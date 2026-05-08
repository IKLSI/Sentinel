using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using Sentinel.Infrastructure.Data;
using Sentinel.API.Extensions;
using Sentinel.API.Middleware;
namespace Sentinel.API;

public static class Program
{
    public static async Task Main(string[] args)
    {
        WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

        string connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("La chaîne de connexion DefaultConnection est manquante");

        builder.Services
            .AddDatabase(builder.Configuration)
            .AddJwtAuthentication(builder.Configuration)
            .AddCorsPolicy(builder.Configuration)
            .AddHangfireServices(connectionString)
            .AddHttpRegistryClients()
            .AddApplicationServices()
            .AddSwaggerWithJwt()
            .AddControllersWithJsonOptions()
            .AddLoginRateLimiting()
            .AddMemoryCache()
            .AddDataProtection();

        WebApplication app = builder.Build();

        if (!app.Environment.IsDevelopment())
        {
            app.UseHsts();
        }

        app.UseMiddleware<ErrorHandlingMiddleware>();
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
        app.UseAuthorization();
        app.ConfigureHangfire();
        app.MapControllers();

        app.Run();
    }
}
