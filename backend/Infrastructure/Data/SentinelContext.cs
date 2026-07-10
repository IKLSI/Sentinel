using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.AspNetCore.DataProtection.KeyManagement;
using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Models;

namespace Sentinel.Infrastructure.Data;

public class SentinelContext : DbContext, IDataProtectionKeyContext
{
    private readonly ITenantContext? _tenant;

    public SentinelContext(DbContextOptions<SentinelContext> options) : base(options) { }

    public SentinelContext(DbContextOptions<SentinelContext> options, ITenantContext tenant) : base(options)
    {
        _tenant = tenant;
    }

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
    public DbSet<TicketStatus> TicketStatuses => Set<TicketStatus>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<TicketAttachment> TicketAttachments => Set<TicketAttachment>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<DataProtectionKey> DataProtectionKeys => Set<DataProtectionKey>();
    public DbSet<ApiKey> ApiKeys => Set<ApiKey>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureOrganization(modelBuilder);
        ConfigureUser(modelBuilder);
        ConfigureUserInvitation(modelBuilder);
        ConfigurePasswordResetToken(modelBuilder);
        ConfigureEmailVerificationToken(modelBuilder);
        ConfigureTicketStatus(modelBuilder);
        ConfigureTicket(modelBuilder);
        ConfigureTicketComment(modelBuilder);
        ConfigureTicketHistory(modelBuilder);
        ConfigureProject(modelBuilder);
        ConfigureDependency(modelBuilder);
        ConfigureVulnerability(modelBuilder);
        ConfigureRuntime(modelBuilder);
        ConfigureAuditLog(modelBuilder);
        ConfigureTicketAttachment(modelBuilder);
        ConfigureNotification(modelBuilder);
        ConfigureApiKey(modelBuilder);

        ApplyTenantQueryFilters(modelBuilder);
    }

    private void ApplyTenantQueryFilters(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Organization>()
            .HasQueryFilter(o => _tenant == null || !_tenant.IsSet || o.Id == _tenant.OrganizationId);

        modelBuilder.Entity<User>()
            .HasQueryFilter(e => _tenant == null || !_tenant.IsSet || e.OrganizationId == _tenant.OrganizationId);

        modelBuilder.Entity<UserInvitation>()
            .HasQueryFilter(e => _tenant == null || !_tenant.IsSet || e.OrganizationId == _tenant.OrganizationId);

        modelBuilder.Entity<TicketStatus>()
            .HasQueryFilter(e => _tenant == null || !_tenant.IsSet || e.OrganizationId == _tenant.OrganizationId);

        modelBuilder.Entity<Ticket>()
            .HasQueryFilter(e => _tenant == null || !_tenant.IsSet || e.OrganizationId == _tenant.OrganizationId);

        modelBuilder.Entity<Project>()
            .HasQueryFilter(e => _tenant == null || !_tenant.IsSet || e.OrganizationId == _tenant.OrganizationId);

        modelBuilder.Entity<AuditLog>()
            .HasQueryFilter(e => _tenant == null || !_tenant.IsSet || e.OrganizationId == _tenant.OrganizationId);

        modelBuilder.Entity<TicketComment>()
            .HasQueryFilter(e => _tenant == null || !_tenant.IsSet || e.Ticket.OrganizationId == _tenant.OrganizationId);

        modelBuilder.Entity<TicketHistory>()
            .HasQueryFilter(e => _tenant == null || !_tenant.IsSet || e.Ticket.OrganizationId == _tenant.OrganizationId);

        modelBuilder.Entity<TicketAttachment>()
            .HasQueryFilter(e => _tenant == null || !_tenant.IsSet || e.Ticket.OrganizationId == _tenant.OrganizationId);

        modelBuilder.Entity<Notification>()
            .HasQueryFilter(e => _tenant == null || !_tenant.IsSet || e.OrganizationId == _tenant.OrganizationId);

        modelBuilder.Entity<Dependency>()
            .HasQueryFilter(e => _tenant == null || !_tenant.IsSet || e.Project.OrganizationId == _tenant.OrganizationId);

        modelBuilder.Entity<Runtime>()
            .HasQueryFilter(e => _tenant == null || !_tenant.IsSet || e.Project.OrganizationId == _tenant.OrganizationId);

        modelBuilder.Entity<Vulnerability>()
            .HasQueryFilter(e => _tenant == null || !_tenant.IsSet || e.Dependency.Project.OrganizationId == _tenant.OrganizationId);

        modelBuilder.Entity<ApiKey>()
            .HasQueryFilter(e => _tenant == null || !_tenant.IsSet || e.OrganizationId == _tenant.OrganizationId);
    }

    private static void ConfigureOrganization(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Organization>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Slug).HasMaxLength(100).IsRequired();
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.Property(e => e.AlertMinSeverity).HasConversion<string>().HasMaxLength(20);
            entity.Property(e => e.GithubToken).HasMaxLength(500);
            entity.Property(e => e.GitlabToken).HasMaxLength(500);
            entity.Property(e => e.PlanTier).HasConversion<string>().HasMaxLength(20);
            entity.Property(e => e.SubscriptionStatus).HasConversion<string>().HasMaxLength(20);
            entity.Property(e => e.StripeCustomerId).HasMaxLength(255);
            entity.Property(e => e.StripeSubscriptionId).HasMaxLength(255);
            entity.HasIndex(e => e.StripeCustomerId).IsUnique().HasFilter("\"StripeCustomerId\" IS NOT NULL");
            entity.HasIndex(e => e.StripeSubscriptionId).IsUnique().HasFilter("\"StripeSubscriptionId\" IS NOT NULL");
        });
    }

    private static void ConfigureEmailVerificationToken(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<EmailVerificationToken>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Email).HasMaxLength(255).IsRequired();
            entity.Property(e => e.TokenHash).HasMaxLength(128).IsRequired();
            entity.HasIndex(e => e.TokenHash).IsUnique();
            entity.HasIndex(e => e.Email);
        });
    }

    private static void ConfigureUser(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Email).HasMaxLength(255).IsRequired();
            entity.Property(e => e.FirstName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.LastName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.Property(e => e.Role).HasConversion<string>();
            entity.Property(e => e.Theme).HasConversion(
                v => v.ToString().ToLowerInvariant(),
                v => Enum.Parse<ThemeType>(v, ignoreCase: true)
            ).HasMaxLength(10);
            entity.HasIndex(e => e.OrganizationId);
            entity.HasIndex(e => new { e.OrganizationId, e.Email }).IsUnique();

            entity.HasOne(e => e.Organization)
                .WithMany(o => o.Users)
                .HasForeignKey(e => e.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureUserInvitation(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserInvitation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Email).HasMaxLength(255).IsRequired();
            entity.Property(e => e.TokenHash).HasMaxLength(128).IsRequired();
            entity.Property(e => e.Role).HasConversion<string>();
            entity.HasIndex(e => e.TokenHash).IsUnique();
            entity.HasIndex(e => e.OrganizationId);
            entity.HasIndex(e => e.Email);

            entity.HasOne(e => e.Organization)
                .WithMany()
                .HasForeignKey(e => e.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.InvitedBy)
                .WithMany()
                .HasForeignKey(e => e.InvitedById)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigurePasswordResetToken(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<PasswordResetToken>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Email).HasMaxLength(255).IsRequired();
            entity.Property(e => e.TokenHash).HasMaxLength(128).IsRequired();
            entity.HasIndex(e => e.TokenHash).IsUnique();
            entity.HasIndex(e => e.Email);
        });
    }

    private static void ConfigureTicketStatus(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TicketStatus>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Color).HasMaxLength(100);
            entity.HasIndex(e => e.OrganizationId);

            entity.HasOne(e => e.Organization)
                .WithMany()
                .HasForeignKey(e => e.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureTicket(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Ticket>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property<uint>("xmin").HasColumnName("xmin").HasColumnType("xid").ValueGeneratedOnAddOrUpdate().IsConcurrencyToken();
            entity.Property(e => e.Title).HasMaxLength(500).IsRequired();
            entity.Property(e => e.Priority).HasConversion<string>();
            entity.Property(e => e.Type).HasConversion<string>();
            entity.Property(e => e.EstimatedHours).HasPrecision(10, 2);
            entity.Property(e => e.Tags).HasColumnType("jsonb");

            entity.HasIndex(e => e.OrganizationId);
            entity.HasIndex(e => e.TicketStatusId);
            entity.HasIndex(e => e.AssignedToId);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.Priority);
            entity.HasIndex(e => e.ProjectId);
            entity.HasIndex(e => new { e.OrganizationId, e.TicketStatusId });
            entity.HasIndex(e => new { e.OrganizationId, e.UpdatedAt });
            entity.HasIndex(e => new { e.OrganizationId, e.CreatedAt });
            entity.HasIndex(e => new { e.OrganizationId, e.Priority, e.TicketStatusId });

            entity.HasOne(e => e.Organization)
                .WithMany()
                .HasForeignKey(e => e.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Project)
                .WithMany(p => p.Tickets)
                .HasForeignKey(e => e.ProjectId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.AssignedTo)
                .WithMany()
                .HasForeignKey(e => e.AssignedToId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.CreatedBy)
                .WithMany()
                .HasForeignKey(e => e.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.TicketStatus)
                .WithMany(s => s.Tickets)
                .HasForeignKey(e => e.TicketStatusId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }

    private static void ConfigureTicketComment(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TicketComment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.TicketId);
            entity.HasIndex(e => e.CreatedAt);

            entity.HasOne(e => e.Ticket)
                .WithMany(t => t.Comments)
                .HasForeignKey(e => e.TicketId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Author)
                .WithMany()
                .HasForeignKey(e => e.AuthorId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureTicketHistory(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TicketHistory>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Field).HasMaxLength(100).IsRequired();
            entity.HasIndex(e => e.TicketId);
            entity.HasIndex(e => e.CreatedAt);

            entity.HasOne(e => e.Ticket)
                .WithMany(t => t.History)
                .HasForeignKey(e => e.TicketId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureProject(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property<uint>("xmin").HasColumnName("xmin").HasColumnType("xid").ValueGeneratedOnAddOrUpdate().IsConcurrencyToken();
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.RepositoryType).HasConversion<string>();
            entity.Property(e => e.ScanFrequency).HasConversion<string>();
            entity.Property(e => e.HealthGrade).HasMaxLength(2);
            entity.HasIndex(e => e.OrganizationId);

            entity.HasOne(e => e.Organization)
                .WithMany()
                .HasForeignKey(e => e.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureDependency(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Dependency>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.CurrentVersion).HasMaxLength(100).IsRequired();
            entity.Property(e => e.LatestVersion).HasMaxLength(100);
            entity.Property(e => e.Type).HasConversion<string>();
            entity.Property(e => e.Ecosystem).HasConversion<string>();
            entity.Property(e => e.Status).HasConversion<string>();
            entity.HasIndex(e => e.ProjectId);
            entity.HasIndex(e => e.Status);

            entity.HasOne(e => e.Project)
                .WithMany(p => p.Dependencies)
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureVulnerability(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Vulnerability>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CveId).HasMaxLength(50).IsRequired();
            entity.Property(e => e.CvssScore).HasPrecision(4, 1);
            entity.Property(e => e.Severity).HasConversion<string>();
            entity.HasIndex(e => e.DependencyId);
            entity.HasIndex(e => e.Severity);
            entity.HasIndex(e => new { e.Severity, e.DependencyId });

            entity.HasOne(e => e.Dependency)
                .WithMany(d => d.Vulnerabilities)
                .HasForeignKey(e => e.DependencyId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureRuntime(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Runtime>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Version).HasMaxLength(50).IsRequired();
            entity.HasIndex(e => e.ProjectId);

            entity.HasOne(e => e.Project)
                .WithMany(p => p.Runtimes)
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureAuditLog(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Action).HasConversion<string>().IsRequired();
            entity.Property(e => e.EntityType).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Jti).HasMaxLength(36);
            entity.HasIndex(e => e.Jti);

            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.OrganizationId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Action);
            entity.HasIndex(e => new { e.EntityType, e.EntityId });
        });
    }

    private static void ConfigureTicketAttachment(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TicketAttachment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FileName).HasMaxLength(255).IsRequired();
            entity.Property(e => e.StoragePath).HasMaxLength(500).IsRequired();
            entity.Property(e => e.ContentType).HasMaxLength(150).IsRequired();
            entity.HasIndex(e => e.TicketId);
            entity.HasIndex(e => e.CreatedAt);

            entity.HasOne(e => e.Ticket)
                .WithMany(t => t.Attachments)
                .HasForeignKey(e => e.TicketId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.UploadedBy)
                .WithMany()
                .HasForeignKey(e => e.UploadedById)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureNotification(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Type).HasConversion<string>().IsRequired();
            entity.Property(e => e.Message).HasMaxLength(500).IsRequired();
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.OrganizationId);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => new { e.UserId, e.IsRead });

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Ticket)
                .WithMany()
                .HasForeignKey(e => e.TicketId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }

    private static void ConfigureApiKey(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ApiKey>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.KeyHash).HasMaxLength(64).IsRequired();
            entity.Property(e => e.Prefix).HasMaxLength(16).IsRequired();
            entity.HasIndex(e => e.KeyHash).IsUnique();
            entity.HasIndex(e => e.OrganizationId);
            entity.HasIndex(e => e.CreatedById);

            entity.HasOne(e => e.Organization)
                .WithMany()
                .HasForeignKey(e => e.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.CreatedBy)
                .WithMany()
                .HasForeignKey(e => e.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
