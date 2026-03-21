using Scalar.AspNetCore;
using Sentinel.Infrastructure.Data;
using Sentinel.API.Extensions;
using Sentinel.API.Middleware;
namespace Sentinel.API;

public static class Program
{
    public static async Task Main(string[] args)
    {
        Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Development");

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
            .AddMemoryCache();

        WebApplication app = builder.Build();

        app.UseMiddleware<ErrorHandlingMiddleware>();
        app.UseRouting();

        using (IServiceScope scope = app.Services.CreateScope())
        {
            DataSeeder seeder = scope.ServiceProvider.GetRequiredService<DataSeeder>();
            await seeder.SeedAsync();
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

        app.UseCors();
        app.UseRateLimiter();
        app.UseAuthentication();
        app.UseMiddleware<JwtMiddleware>();
        app.UseAuthorization();
        app.ConfigureHangfire();
        app.MapControllers();

        app.Run();
    }
}
