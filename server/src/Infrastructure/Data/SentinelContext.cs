using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Entities;

namespace Sentinel.Infrastructure.Data;

public partial class SentinelContext : DbContext, IDataProtectionKeyContext
{
    private readonly ITenantContext? _tenant;
    private readonly ISystemScope? _systemScope;

    public SentinelContext(DbContextOptions<SentinelContext> options) : base(options) { }

    public SentinelContext(DbContextOptions<SentinelContext> options, ITenantContext tenant, ISystemScope systemScope)
        : base(options)
    {
        _tenant = tenant;
        _systemScope = systemScope;
    }

    private bool BypassTenantFilter => _systemScope?.IsActive == true;

    private Guid CurrentOrganizationId => _tenant?.OrganizationId ?? Guid.Empty;

    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<TicketComment> TicketComments => Set<TicketComment>();
    public DbSet<TicketHistory> TicketHistories => Set<TicketHistory>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Dependency> Dependencies => Set<Dependency>();
    public DbSet<Vulnerability> Vulnerabilities => Set<Vulnerability>();
    public DbSet<Runtime> Runtimes => Set<Runtime>();
    public DbSet<UserInvitation> UserInvitations => Set<UserInvitation>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<EmailVerificationToken> EmailVerificationTokens => Set<EmailVerificationToken>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<TicketAttachment> TicketAttachments => Set<TicketAttachment>();
    public DbSet<DataProtectionKey> DataProtectionKeys => Set<DataProtectionKey>();
    public DbSet<ApiKey> ApiKeys => Set<ApiKey>();
    public DbSet<ProjectHealthSnapshot> ProjectHealthSnapshots => Set<ProjectHealthSnapshot>();
    public DbSet<VulnerabilityResolution> VulnerabilityResolutions => Set<VulnerabilityResolution>();
    public DbSet<VulnerabilitySuppression> VulnerabilitySuppressions => Set<VulnerabilitySuppression>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasPostgresExtension("pg_trgm");

        ConfigureOrganization(modelBuilder);
        ConfigureUser(modelBuilder);
        ConfigureUserInvitation(modelBuilder);
        ConfigurePasswordResetToken(modelBuilder);
        ConfigureEmailVerificationToken(modelBuilder);
        ConfigureTicket(modelBuilder);
        ConfigureTicketComment(modelBuilder);
        ConfigureTicketHistory(modelBuilder);
        ConfigureProject(modelBuilder);
        ConfigureDependency(modelBuilder);
        ConfigureVulnerability(modelBuilder);
        ConfigureRuntime(modelBuilder);
        ConfigureProjectHealthSnapshot(modelBuilder);
        ConfigureVulnerabilityResolution(modelBuilder);
        ConfigureVulnerabilitySuppression(modelBuilder);
        ConfigureAuditLog(modelBuilder);
        ConfigureTicketAttachment(modelBuilder);
        ConfigureApiKey(modelBuilder);

        ApplyTenantQueryFilters(modelBuilder);
    }

    private void ApplyTenantQueryFilters(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Organization>()
            .HasQueryFilter(o => BypassTenantFilter || o.Id == CurrentOrganizationId);

        modelBuilder.Entity<User>()
            .HasQueryFilter(e => BypassTenantFilter || e.OrganizationId == CurrentOrganizationId);

        modelBuilder.Entity<UserInvitation>()
            .HasQueryFilter(e => BypassTenantFilter || e.OrganizationId == CurrentOrganizationId);

        modelBuilder.Entity<Ticket>()
            .HasQueryFilter(e => BypassTenantFilter || e.OrganizationId == CurrentOrganizationId);

        modelBuilder.Entity<Project>()
            .HasQueryFilter(e => BypassTenantFilter || e.OrganizationId == CurrentOrganizationId);

        modelBuilder.Entity<AuditLog>()
            .HasQueryFilter(e => BypassTenantFilter || e.OrganizationId == CurrentOrganizationId);

        modelBuilder.Entity<TicketComment>()
            .HasQueryFilter(e => BypassTenantFilter || e.Ticket.OrganizationId == CurrentOrganizationId);

        modelBuilder.Entity<TicketHistory>()
            .HasQueryFilter(e => BypassTenantFilter || e.Ticket.OrganizationId == CurrentOrganizationId);

        modelBuilder.Entity<TicketAttachment>()
            .HasQueryFilter(e => BypassTenantFilter || e.Ticket.OrganizationId == CurrentOrganizationId);

        modelBuilder.Entity<Dependency>()
            .HasQueryFilter(e => BypassTenantFilter || e.Project.OrganizationId == CurrentOrganizationId);

        modelBuilder.Entity<Runtime>()
            .HasQueryFilter(e => BypassTenantFilter || e.Project.OrganizationId == CurrentOrganizationId);

        modelBuilder.Entity<Vulnerability>()
            .HasQueryFilter(e => BypassTenantFilter || e.Dependency.Project.OrganizationId == CurrentOrganizationId);

        modelBuilder.Entity<ApiKey>()
            .HasQueryFilter(e => BypassTenantFilter || e.OrganizationId == CurrentOrganizationId);

        modelBuilder.Entity<ProjectHealthSnapshot>()
            .HasQueryFilter(e => BypassTenantFilter || e.OrganizationId == CurrentOrganizationId);

        modelBuilder.Entity<VulnerabilityResolution>()
            .HasQueryFilter(e => BypassTenantFilter || e.OrganizationId == CurrentOrganizationId);

        modelBuilder.Entity<VulnerabilitySuppression>()
            .HasQueryFilter(e => BypassTenantFilter || e.OrganizationId == CurrentOrganizationId);

        modelBuilder.Entity<PasswordResetToken>()
            .HasQueryFilter(e => BypassTenantFilter || Users.Select(u => u.Id).Contains(e.UserId));

        modelBuilder.Entity<EmailVerificationToken>()
            .HasQueryFilter(e => BypassTenantFilter || Users.Select(u => u.Id).Contains(e.UserId));
    }
}
