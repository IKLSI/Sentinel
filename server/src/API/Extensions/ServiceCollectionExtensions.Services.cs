using Sentinel.API.Services;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Audit;
using Sentinel.Application.Billing;
using Sentinel.Application.Dashboard;
using Sentinel.Application.Exports;
using Sentinel.Application.Jobs;
using Sentinel.Application.Security;
using Sentinel.Application.TechHealth;
using Sentinel.Application.TechHealth.ComplianceReport;
using Sentinel.Application.TechHealth.ExportSbom;
using Sentinel.Application.TechHealth.Scan;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Infrastructure.Data;
using Sentinel.Infrastructure.Email;
using Sentinel.Infrastructure.Hosting;
using Sentinel.Infrastructure.Http;
using Sentinel.Infrastructure.Jobs;
using Sentinel.Infrastructure.Localization;
using Sentinel.Infrastructure.Payments;
using Sentinel.Infrastructure.Storage;

namespace Sentinel.API.Extensions;

public static partial class ServiceCollectionExtensions
{
    public static IServiceCollection AddTenantContext(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<ITenantContext, TenantContext>();
        services.AddSingleton<ISystemScope, SystemScope>();
        services.AddSingleton<IContentPathProvider, ContentPathProvider>();
        services.AddSingleton<ILocalizer, JsonLocalizer>();
        services.AddScoped<IRefreshTokenStore, RefreshTokenCookie>();

        return services;
    }

    public static IServiceCollection AddHttpRegistryClients(this IServiceCollection services)
    {
        services.AddSingleton<HostConcurrencyLimiter>();
        services.AddTransient<ResilientHttpHandler>();
        services.AddTransient<HostConcurrencyHandler>();

        services.AddResilientHttpClient(HttpClientNames.Osv, 90, client =>
        {
            client.BaseAddress = new Uri("https://api.osv.dev");
            client.DefaultRequestHeaders.Add("Accept", "application/json");
        });

        services.AddResilientHttpClient(HttpClientNames.Registry, 90, client =>
            client.DefaultRequestHeaders.Add("User-Agent", "Sentinel-Scanner/1.0"));

        services.AddResilientHttpClient(HttpClientNames.EolDate, 45, client =>
            client.DefaultRequestHeaders.Add("Accept", "application/json"));

        return services;
    }

    private static IServiceCollection AddResilientHttpClient(
        this IServiceCollection services,
        string name,
        int timeoutSeconds,
        Action<HttpClient> configure)
    {
        services.AddHttpClient(name, client =>
        {
            configure(client);
            client.Timeout = TimeSpan.FromSeconds(timeoutSeconds);
        })
        .AddHttpMessageHandler<ResilientHttpHandler>()
        .AddHttpMessageHandler<HostConcurrencyHandler>();

        return services;
    }

    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddSingleton<AuditLogQueue>();
        services.AddScoped<IAuditLogService, AuditLogService>();
        services.AddScoped<AuditLogBatchWriter>();
        services.AddHostedService<AuditLogBackgroundWriter>();
        services.AddScoped<ITokenBlacklistService, TokenBlacklistService>();
        services.AddScoped<TokenService>();
        services.AddScoped<TokenProtector>();
        services.AddScoped<QueuedTokenProtector>();
        services.AddScoped<ExportService>();
        services.AddScoped<DashboardCache>();
        services.AddScoped<ManifestParserService>();
        services.AddScoped<RepositoryScannerService>();
        services.AddScoped<VulnerabilityScanService>();
        services.AddScoped<RuntimeEolScanService>();
        services.AddScoped<VulnerabilityAlertService>();
        services.AddScoped<FindingTicketSyncService>();
        services.AddScoped<ProjectInventoryWriter>();
        services.AddScoped<ProjectScanService>();
        services.AddScoped<DueProjectScanService>();
        services.AddScoped<SbomService>();
        services.AddScoped<ComplianceReportService>();
        services.AddScoped<QuotaGuard>();

        services.AddTransient<TechHealthScanJob>();
        services.AddTransient<PurgeExpiredRevokedTokensJob>();
        services.AddTransient<SendInvitationEmailJob>();
        services.AddTransient<SendPasswordResetEmailJob>();
        services.AddTransient<SendEmailVerificationJob>();
        services.AddTransient<SendAccountSuspendedEmailJob>();

        return services;
    }

    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
    {
        services.AddScoped<IRepositoryHostClient, RepositoryHostClient>();
        services.AddScoped<IDependencyRegistryClient, DependencyRegistryClient>();
        services.AddScoped<IVulnerabilityFeedClient, OsvVulnerabilityFeedClient>();
        services.AddScoped<IRuntimeLifecycleClient, EndOfLifeRuntimeLifecycleClient>();
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

    public static IServiceCollection AddStripe(this IServiceCollection services, IConfiguration configuration)
    {
        StripeSettings stripe = ReadSettings<StripeSettings>(configuration, ConfigurationKeys.Sections.Stripe);

        string apiKey = string.IsNullOrEmpty(stripe.SecretKey) ? "sk_test_placeholder" : stripe.SecretKey;

        services.AddSingleton<Stripe.IStripeClient>(new Stripe.StripeClient(apiKey));
        services.AddScoped<IBillingGateway, StripeBillingGateway>();
        services.AddScoped<IBillingWebhookParser, StripeWebhookParser>();

        return services;
    }
}
