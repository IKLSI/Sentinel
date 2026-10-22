using Microsoft.Extensions.DependencyInjection;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;
using Sentinel.Infrastructure.Security;

namespace Sentinel.Infrastructure.Repositories;

public static class RepositoryServiceCollectionExtensions
{
    public static IServiceCollection AddRepositories(this IServiceCollection services)
    {
        services.AddScoped<ICommitScopeFactory, CommitScopeFactory>();
        services.AddScoped<IDatabaseConnectionHolder, DatabaseConnectionHolder>();
        services.AddSingleton<IPasswordHasher, BCryptPasswordHasher>();

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IOrganizationRepository, OrganizationRepository>();
        services.AddScoped<IPasswordResetTokenRepository, PasswordResetTokenRepository>();
        services.AddScoped<IEmailVerificationTokenRepository, EmailVerificationTokenRepository>();
        services.AddScoped<IUserInvitationRepository, UserInvitationRepository>();
        services.AddScoped<ITicketRepository, TicketRepository>();
        services.AddScoped<ITicketCommentRepository, TicketCommentRepository>();
        services.AddScoped<ITicketAttachmentRepository, TicketAttachmentRepository>();
        services.AddScoped<ITicketHistoryRepository, TicketHistoryRepository>();
        services.AddScoped<IProjectRepository, ProjectRepository>();
        services.AddScoped<IApiKeyRepository, ApiKeyRepository>();
        services.AddScoped<IAuditLogRepository, AuditLogRepository>();
        services.AddScoped<IDependencyRepository, DependencyRepository>();
        services.AddScoped<IVulnerabilityRepository, VulnerabilityRepository>();
        services.AddScoped<IRuntimeRepository, RuntimeRepository>();
        services.AddScoped<IDashboardRepository, DashboardRepository>();
        services.AddScoped<IProjectHealthSnapshotRepository, ProjectHealthSnapshotRepository>();
        services.AddScoped<IVulnerabilityResolutionRepository, VulnerabilityResolutionRepository>();
        services.AddScoped<IDataRetentionRepository, DataRetentionRepository>();
        services.AddScoped<IVulnerabilitySuppressionRepository, VulnerabilitySuppressionRepository>();
        services.AddScoped<IVulnerabilityRemediationRepository, VulnerabilityRemediationRepository>();

        return services;
    }
}
