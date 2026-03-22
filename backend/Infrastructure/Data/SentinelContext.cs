using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Models;

namespace Sentinel.Infrastructure.Data;

public class SentinelContext : DbContext
{
    public SentinelContext(DbContextOptions<SentinelContext> options) : base(options) { }

    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<TicketComment> TicketComments => Set<TicketComment>();
    public DbSet<TicketHistory> TicketHistories => Set<TicketHistory>();
    public DbSet<TimeEntry> TimeEntries => Set<TimeEntry>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<TechProject> TechProjects => Set<TechProject>();
    public DbSet<Dependency> Dependencies => Set<Dependency>();
    public DbSet<Vulnerability> Vulnerabilities => Set<Vulnerability>();
    public DbSet<Runtime> Runtimes => Set<Runtime>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureOrganization(modelBuilder);
        ConfigureUser(modelBuilder);
        ConfigureTicket(modelBuilder);
        ConfigureTicketComment(modelBuilder);
        ConfigureTicketHistory(modelBuilder);
        ConfigureTimeEntry(modelBuilder);
        ConfigureInvoice(modelBuilder);
        ConfigureTechProject(modelBuilder);
        ConfigureDependency(modelBuilder);
        ConfigureVulnerability(modelBuilder);
        ConfigureRuntime(modelBuilder);
    }

    private static void ConfigureOrganization(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Organization>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Slug).HasMaxLength(100).IsRequired();
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.Property(e => e.Timezone).HasMaxLength(50);
            entity.Property(e => e.SlaCriticalHours).HasDefaultValue(4);
            entity.Property(e => e.SlaHighHours).HasDefaultValue(8);
            entity.Property(e => e.SlaMediumHours).HasDefaultValue(24);
            entity.Property(e => e.SlaLowHours).HasDefaultValue(48);
        });
    }

    private static void ConfigureUser(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Email).HasMaxLength(255).IsRequired();
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.FirstName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.LastName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.Property(e => e.Role).HasConversion<string>();
            entity.HasIndex(e => e.OrganizationId);
            entity.HasIndex(e => new { e.OrganizationId, e.Email }).IsUnique();

            entity.HasOne(e => e.Organization)
                .WithMany(o => o.Users)
                .HasForeignKey(e => e.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureTicket(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Ticket>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(500).IsRequired();
            entity.Property(e => e.Priority).HasConversion<string>();
            entity.Property(e => e.Type).HasConversion<string>();
            entity.Property(e => e.Status).HasConversion<string>();
            entity.Property(e => e.EstimatedHours).HasPrecision(10, 2);
            entity.Property(e => e.Tags).HasColumnType("jsonb");

            entity.HasIndex(e => e.OrganizationId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.AssignedToId);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.Priority);
            entity.HasIndex(e => e.SlaBreached);

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

    private static void ConfigureTimeEntry(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TimeEntry>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Comment).HasMaxLength(1000);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.TicketId);
            entity.HasIndex(e => e.Date);

            entity.HasOne(e => e.Ticket)
                .WithMany(t => t.TimeEntries)
                .HasForeignKey(e => e.TicketId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.TechProject)
                .WithMany()
                .HasForeignKey(e => e.TechProjectId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.User)
                .WithMany(u => u.TimeEntries)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureInvoice(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Period).HasMaxLength(7).IsRequired();
            entity.Property(e => e.Label).HasMaxLength(300).IsRequired();
            entity.Property(e => e.TotalHours).HasPrecision(10, 2);
            entity.Property(e => e.DailyRate).HasPrecision(10, 2);
            entity.Property(e => e.TotalAmount).HasPrecision(12, 2);
            entity.Property(e => e.TaxRate).HasPrecision(5, 2);
            entity.Property(e => e.Status).HasConversion<string>();
            entity.HasIndex(e => e.OrganizationId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.Period);

            entity.HasOne(e => e.Organization)
                .WithMany()
                .HasForeignKey(e => e.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.TechProject)
                .WithMany()
                .HasForeignKey(e => e.TechProjectId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }

    private static void ConfigureTechProject(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TechProject>(entity =>
        {
            entity.HasKey(e => e.Id);
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
            entity.HasIndex(e => e.TechProjectId);
            entity.HasIndex(e => e.Status);

            entity.HasOne(e => e.TechProject)
                .WithMany(p => p.Dependencies)
                .HasForeignKey(e => e.TechProjectId)
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
            entity.HasIndex(e => e.TechProjectId);

            entity.HasOne(e => e.TechProject)
                .WithMany(p => p.Runtimes)
                .HasForeignKey(e => e.TechProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

}
