using System.Net;
using Sentinel.API.HealthChecks;
using Sentinel.API.Services;
using Sentinel.Application.Abstractions;
using Sentinel.Application.ApiKeys;
using Sentinel.Application.Audit;
using Sentinel.Application.Auth.AccountState;
using Sentinel.Application.Auth.Login;
using Sentinel.Application.Dashboard;
using Sentinel.Application.Exports;
using Sentinel.Application.Jobs;
using Sentinel.Application.Security;
using Sentinel.Application.Tickets;
using Sentinel.Application.TechHealth.ComplianceReport;
using Sentinel.Application.TechHealth.ExportSbom;
using Sentinel.Application.TechHealth.PublicScan;
using Sentinel.Application.TechHealth.Suppressions;
using Sentinel.Application.TechHealth.Scan;
using Sentinel.Application.Users;
using Sentinel.Domain.Abstractions;
using Sentinel.Infrastructure.Data;
using Sentinel.Infrastructure.Email;
using Sentinel.Infrastructure.Hosting;
using Sentinel.Infrastructure.Http;
using Sentinel.Infrastructure.Jobs;
using Sentinel.Infrastructure.Localization;
using Sentinel.Infrastructure.Storage;

namespace Sentinel.API.Extensions;

public static partial class ServiceCollectionExtensions
{
    public static IServiceCollection AddTenantContext(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<ITenantContext, TenantContext>();
        services.AddSingleton<IContentPathProvider, ContentPathProvider>();
        services.AddScoped<IRefreshTokenStore, RefreshTokenCookie>();

        return services;
    }

    public static IServiceCollection AddHealthCheckServices(this IServiceCollection services)
    {
        services.AddHealthChecks().AddCheck<DatabaseHealthCheck>("database");

        return services;
    }

    public static IServiceCollection AddHttpRegistryClients(this IServiceCollection services)
    {
        services.AddSingleton<HostConcurrencyLimiter>();
        services.AddSingleton<InFlightRequestCoalescer>();
        services.AddTransient<HostConcurrencyHandler>();

        services.AddResilientHttpClient(HttpClientNames.Osv, 90, client =>
        {
            client.BaseAddress = new Uri("https://api.osv.dev");
            client.DefaultRequestHeaders.Add("Accept", "application/json");
        });

        services.AddResilientHttpClient(HttpClientNames.Registry, 90, client =>
            client.DefaultRequestHeaders.Add("User-Agent", "Sentinel-Scanner/1.0"));

        services.AddResilientHttpClient(HttpClientNames.GitLab, 90, client =>
            client.DefaultRequestHeaders.Add("User-Agent", "Sentinel-Scanner/1.0"), publicNetworkOnly: true);

        services.AddResilientHttpClient(HttpClientNames.EolDate, 45, client =>
            client.DefaultRequestHeaders.Add("Accept", "application/json"));

        services.AddResilientHttpClient(HttpClientNames.Epss, 45, client =>
        {
            client.BaseAddress = new Uri("https://api.first.org");
            client.DefaultRequestHeaders.Add("Accept", "application/json");
        });

        services.AddResilientHttpClient(HttpClientNames.Kev, 60, client =>
            client.DefaultRequestHeaders.Add("Accept", "application/json"));

        services.AddHttpClient(HttpClientNames.RemediationRunner, client =>
        {
            client.DefaultRequestHeaders.Add("User-Agent", "Sentinel-Remediation/1.0");
            client.Timeout = TimeSpan.FromSeconds(30);
        });

        return services;
    }

    private const string HttpRetryPipelineName = "retry";

    private static IServiceCollection AddResilientHttpClient(
        this IServiceCollection services,
        string name,
        int timeoutSeconds,
        Action<HttpClient> configure,
        bool publicNetworkOnly = false)
    {
        IHttpClientBuilder httpClient = services.AddHttpClient(name, client =>
        {
            configure(client);
            client.Timeout = TimeSpan.FromSeconds(timeoutSeconds);
        })
        .ConfigurePrimaryHttpMessageHandler(() => new SocketsHttpHandler
        {
            AutomaticDecompression = DecompressionMethods.All,
            PooledConnectionLifetime = TimeSpan.FromMinutes(5),
            AllowAutoRedirect = !publicNetworkOnly,
            ConnectCallback = publicNetworkOnly ? PublicNetworkConnector.ConnectAsync : null
        })
        .SetHandlerLifetime(Timeout.InfiniteTimeSpan);

        httpClient.AddResilienceHandler(HttpRetryPipelineName, (pipeline, context) => HttpRetryPolicy.Configure(pipeline,
            context.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger(typeof(HttpRetryPolicy))));
        httpClient.AddHttpMessageHandler<HostConcurrencyHandler>();

        return services;
    }

    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddSingleton<AuditLogQueue>();
        services.AddScoped<IAuditLogService, AuditLogService>();
        services.AddScoped<AuditLogBatchWriter>();
        services.AddHostedService<AuditLogBackgroundWriter>();
        services.AddScoped<TokenService>();
        services.AddSingleton<LoginAttemptTracker>();
        services.AddScoped<TokenProtector>();
        services.AddScoped<QueuedTokenProtector>();
        services.AddScoped<ExportService>();
        services.AddSingleton<DashboardCache>();
        services.AddScoped<ApiKeyPrincipalCache>();
        services.AddScoped<UserSessionCache>();
        services.AddScoped<TicketLinkChecker>();
        services.AddScoped<LastAdminGuard>();
        services.AddScoped<AccountSessionValidator>();
        services.AddScoped<ManifestParserService>();
        services.AddScoped<RepositoryScannerService>();
        services.AddScoped<RegistryMetadataApplier>();
        services.AddScoped<VulnerabilityScanService>();
        services.AddScoped<RuntimeEolScanService>();
        services.AddScoped<ExploitSignalEnricher>();
        services.AddScoped<VulnerabilityAlertService>();
        services.AddScoped<FindingTicketSyncService>();
        services.AddScoped<CriticalVulnerabilityTicketService>();
        services.AddScoped<ProjectInventoryWriter>();
        services.AddScoped<ProjectHealthHistoryWriter>();
        services.AddScoped<ProjectInventoryAcquirer>();
        services.AddScoped<ProjectFindingsRefresher>();
        services.AddScoped<ScanFollowUpService>();
        services.AddScoped<ProjectScanService>();
        services.AddScoped<DueProjectScanService>();
        services.AddSingleton<ProjectScanGate>();
        services.AddSingleton<PublicScanThrottle>();
        services.AddScoped<SbomService>();
        services.AddScoped<ComplianceReportService>();
        services.AddScoped<ProjectHealthRecalculator>();

        services.AddTransient<TechHealthScanJob>();
        services.AddTransient<DataRetentionJob>();
        services.AddTransient<SendInvitationEmailJob>();
        services.AddTransient<SendPasswordResetEmailJob>();
        services.AddTransient<SendEmailVerificationJob>();
        services.AddTransient<SendAccountSuspendedEmailJob>();
        services.AddTransient<RemediationRunJob>();

        return services;
    }

    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
    {
        services.AddSingleton<ISystemScope, SystemScope>();
        services.AddSingleton<ILocalizer, JsonLocalizer>();
        services.AddSingleton<ILocaleCatalogSource, JsonLocaleCatalogSource>();
        services.AddScoped<IRepositoryHostClient, RepositoryHostClient>();
        services.AddScoped<IDependencyRegistryClient, DependencyRegistryClient>();
        services.AddScoped<IVulnerabilityFeedClient, OsvVulnerabilityFeedClient>();
        services.AddScoped<IRuntimeLifecycleClient, EndOfLifeRuntimeLifecycleClient>();
        services.AddScoped<IExploitIntelligenceClient, ExploitIntelligenceClient>();
        services.AddScoped<IRemediationRunner, GitHubActionsRemediationRunner>();
        services.AddScoped<IJobScheduler, HangfireJobScheduler>();
        services.AddSingleton<IRecurringJobMonitor, HangfireRecurringJobMonitor>();
        services.AddSingleton<IScopedServiceRunner, ScopedServiceRunner>();
        services.AddSingleton<IEmailService, EmailService>();
        services.AddSingleton<IAttachmentStorage, InlineAttachmentStorage>();
        services.AddScoped<DataSeeder>();

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
}
