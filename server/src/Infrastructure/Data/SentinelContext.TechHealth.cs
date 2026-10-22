using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Entities;

namespace Sentinel.Infrastructure.Data;

public partial class SentinelContext
{
    private static void ConfigureProject(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property<uint>("xmin").HasColumnName("xmin").HasColumnType("xid").ValueGeneratedOnAddOrUpdate().IsConcurrencyToken();
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.RepositoryType).HasConversion<string>();
            entity.Property(e => e.ScanFrequency).HasConversion<string>();
            entity.Property(e => e.Coverage).HasConversion<string>();
            entity.Property(e => e.HealthGrade).HasMaxLength(2);
            entity.Property(e => e.LastScannedCommitSha).HasMaxLength(64);
            entity.Property(e => e.Branch).HasMaxLength(255);
            entity.Property(e => e.RootPath).HasMaxLength(500);
            entity.Property(e => e.BadgeToken).HasMaxLength(64);
            entity.HasIndex(e => e.BadgeToken).IsUnique().HasFilter("\"BadgeToken\" IS NOT NULL");
            entity.HasIndex(e => e.OrganizationId);
            entity.HasAlternateKey(e => new { e.Id, e.OrganizationId });
            entity.HasIndex(e => new { e.ScanFrequency, e.LastScanAt });

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
            entity.Property(e => e.ManifestPath).HasMaxLength(1000);
            entity.Property(e => e.Publisher);
            entity.Property(e => e.License);
            entity.Property(e => e.Type).HasConversion<string>();
            entity.Property(e => e.Ecosystem).HasConversion<string>();
            entity.Property(e => e.Status).HasConversion<string>();
            entity.HasIndex(e => e.OrganizationId);
            entity.HasAlternateKey(e => new { e.Id, e.OrganizationId });

            entity.HasOne(e => e.Project)
                .WithMany(p => p.Dependencies)
                .HasForeignKey(e => new { e.ProjectId, e.OrganizationId })
                .HasPrincipalKey(p => new { p.Id, p.OrganizationId })
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureVulnerability(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Vulnerability>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CveId).HasMaxLength(50).IsRequired();
            entity.Property(e => e.CveAlias).HasMaxLength(50);
            entity.Property(e => e.CvssScore).HasPrecision(4, 1);
            entity.Property(e => e.EpssScore).HasPrecision(6, 5);
            entity.Property(e => e.EpssPercentile).HasPrecision(6, 5);
            entity.Property(e => e.Severity).HasConversion<string>();
            entity.HasIndex(e => new { e.Severity, e.DependencyId });
            entity.HasIndex(e => e.DetectedAt);
            entity.HasIndex(e => new { e.OrganizationId, e.Severity });

            entity.HasOne(e => e.Dependency)
                .WithMany(d => d.Vulnerabilities)
                .HasForeignKey(e => new { e.DependencyId, e.OrganizationId })
                .HasPrincipalKey(d => new { d.Id, d.OrganizationId })
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
            entity.HasIndex(e => e.OrganizationId);

            entity.HasOne(e => e.Project)
                .WithMany(p => p.Runtimes)
                .HasForeignKey(e => new { e.ProjectId, e.OrganizationId })
                .HasPrincipalKey(p => new { p.Id, p.OrganizationId })
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureProjectHealthSnapshot(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProjectHealthSnapshot>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Grade).HasMaxLength(2).IsRequired();
            entity.HasIndex(e => new { e.ProjectId, e.Day }).IsUnique();
            entity.HasIndex(e => new { e.OrganizationId, e.Day });

            entity.HasOne(e => e.Project)
                .WithMany()
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureVulnerabilityResolution(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<VulnerabilityResolution>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CveId).HasMaxLength(50).IsRequired();
            entity.HasIndex(e => new { e.OrganizationId, e.ResolvedAt });
            entity.HasIndex(e => new { e.OrganizationId, e.DetectedAt });

            entity.HasOne(e => e.Project)
                .WithMany()
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureVulnerabilitySuppression(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<VulnerabilitySuppression>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FindingKey).HasMaxLength(500).IsRequired();
            entity.Property(e => e.Reason).HasConversion<string>().HasMaxLength(30).IsRequired();
            entity.HasIndex(e => new { e.ProjectId, e.FindingKey }).IsUnique();
            entity.HasIndex(e => e.OrganizationId);

            entity.HasOne(e => e.Project)
                .WithMany()
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureVulnerabilityRemediation(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<VulnerabilityRemediation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FindingKey).HasMaxLength(500).IsRequired();
            entity.Property(e => e.Ecosystem).HasConversion<string>().HasMaxLength(30).IsRequired();
            entity.Property(e => e.PackageName).HasMaxLength(500).IsRequired();
            entity.Property(e => e.TargetVersion).HasMaxLength(100).IsRequired();
            entity.Property(e => e.BranchName).HasMaxLength(250).IsRequired();
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
            entity.Property(e => e.RunnerJobId).HasMaxLength(100);
            entity.Property(e => e.MergeRequestUrl).HasMaxLength(1000);
            entity.Property(e => e.FailureCode).HasMaxLength(100);
            entity.Property(e => e.ConfigTicketHash).HasMaxLength(64);
            entity.Ignore(e => e.IsInProgress);
            entity.HasIndex(e => new { e.ProjectId, e.FindingKey }).IsUnique();
            entity.HasIndex(e => e.OrganizationId);

            entity.HasOne(e => e.Project)
                .WithMany()
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
