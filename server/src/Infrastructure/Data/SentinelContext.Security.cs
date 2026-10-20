using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Entities;

namespace Sentinel.Infrastructure.Data;

public partial class SentinelContext
{
    private static AuditAction AuditActionFromStorage(string stored) =>
        Enum.TryParse(stored, out AuditAction action) ? action : AuditAction.Unknown;

    private static void ConfigureAuditLog(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Action)
                .HasConversion(action => action.ToString(), stored => AuditActionFromStorage(stored))
                .IsRequired();
            entity.Property(e => e.EntityType).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Jti).HasMaxLength(36);
            entity.HasIndex(e => e.Jti);

            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.OrganizationId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.EntityType, e.EntityId });
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
