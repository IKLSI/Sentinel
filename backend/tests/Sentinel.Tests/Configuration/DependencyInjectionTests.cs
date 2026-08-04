using FluentAssertions;
using Hangfire;
using Hangfire.Common;
using Hangfire.States;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Sentinel.API.Extensions;
using Sentinel.Application.Abstractions;
using Sentinel.Infrastructure.Repositories;

namespace Sentinel.Tests.Configuration;

public class DependencyInjectionTests
{
    [Fact]
    public void LeScanDesCasDUsage_TrouveLesServicesEtLesValidateurs()
    {
        UseCaseTypes().Should().HaveCountGreaterThan(50);
    }

    [Fact]
    public void ChaqueCasDUsage_EstResolvableDepuisLeConteneur()
    {
        using ServiceProvider provider = BuildProvider();
        using IServiceScope scope = provider.CreateScope();

        List<string> failures = [];

        foreach (Type useCaseType in UseCaseTypes())
        {
            try
            {
                scope.ServiceProvider.GetRequiredService(useCaseType);
            }
            catch (Exception exception)
            {
                failures.Add($"{useCaseType.FullName} → {RootCause(exception).Message}");
            }
        }

        failures.Should().BeEmpty(
            "every use-case service must be resolvable at startup, not on the first endpoint call");
    }

    private static IReadOnlyList<Type> UseCaseTypes() => typeof(IService).Assembly
        .GetTypes()
        .Where(type => type is { IsClass: true, IsAbstract: false }
            && (typeof(IService).IsAssignableFrom(type) || typeof(IValidator).IsAssignableFrom(type)))
        .OrderBy(type => type.FullName)
        .ToList();

    private static Exception RootCause(Exception exception) =>
        exception.InnerException == null ? exception : RootCause(exception.InnerException);

    private static ServiceProvider BuildProvider()
    {
        const string connectionString =
            "Host=localhost;Database=sentinel_non_connecte;Username=sentinel;Password=sentinel";

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = connectionString
            })
            .Build();

        IHostEnvironment environment = new StubWebHostEnvironment();

        ServiceCollection services = new ServiceCollection();

        services.AddLogging();
        services.AddSingleton<IWebHostEnvironment>((StubWebHostEnvironment)environment);
        services.AddSingleton(configuration);

        services.AddDataProtection();
        services.AddSingleton<IBackgroundJobClient, StubBackgroundJobClient>();
        services.AddSingleton<IRecurringJobManager, StubRecurringJobManager>();

        services
            .AddSettings(configuration, environment)
            .AddTenantContext()
            .AddDatabase(configuration)
            .AddRepositories()
            .AddHttpRegistryClients()
            .AddRealtimeServices()
            .AddApplicationServices()
            .AddInfrastructureServices()
            .AddUseCases()
            .AddMemoryCache()
            .AddStripe(configuration);

        return services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateScopes = true
        });
    }

    private sealed class StubBackgroundJobClient : IBackgroundJobClient
    {
        public string Create(Job job, IState state) => Guid.NewGuid().ToString();

        public bool ChangeState(string jobId, IState state, string expectedState) => true;
    }

    private sealed class StubRecurringJobManager : IRecurringJobManager
    {
        public void AddOrUpdate(string recurringJobId, Job job, string cronExpression, RecurringJobOptions options) { }

        public void Trigger(string recurringJobId) { }

        public void RemoveIfExists(string recurringJobId) { }
    }

    private sealed class StubWebHostEnvironment : IWebHostEnvironment
    {
        public string ApplicationName { get; set; } = "Sentinel.Tests";
        public string EnvironmentName { get; set; } = Environments.Development;
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public string WebRootPath { get; set; } = AppContext.BaseDirectory;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
    }
}
