using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Entities;

namespace Sentinel.Infrastructure.Data;

public partial class SentinelContext
{
    private const string TicketPriorityRankSql =
        """CASE "Priority" WHEN 'Critical' THEN 4 WHEN 'High' THEN 3 WHEN 'Medium' THEN 2 ELSE 1 END""";

    private static void ConfigureTicket(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Ticket>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property<uint>("xmin").HasColumnName("xmin").HasColumnType("xid").ValueGeneratedOnAddOrUpdate().IsConcurrencyToken();
            entity.Property(e => e.Title).HasMaxLength(500).IsRequired();
            entity.Property(e => e.Priority).HasConversion<string>();
            entity.Property(e => e.PriorityRank)
                .HasComputedColumnSql(TicketPriorityRankSql, stored: true);
            entity.Property(e => e.Type).HasConversion<string>();
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
            entity.Property(e => e.FindingKind).HasConversion<string>().HasMaxLength(30);
            entity.Property(e => e.FindingKey).HasMaxLength(500);

            entity.HasIndex(e => new { e.OrganizationId, e.Number }).IsUnique();
            entity.HasIndex(e => e.AssignedToId);
            entity.HasIndex(e => e.ProjectId);
            entity.HasIndex(e => new { e.OrganizationId, e.UpdatedAt });
            entity.HasIndex(e => new { e.OrganizationId, e.CreatedAt });
            entity.HasIndex(e => new { e.OrganizationId, e.Priority, e.Status });
            entity.HasIndex(e => new { e.OrganizationId, e.Status, e.PriorityRank, e.CreatedAt });
            entity.HasIndex(e => new { e.OrganizationId, e.PriorityRank, e.CreatedAt });
            entity.HasIndex(e => e.Title).HasMethod("gin").HasOperators("gin_trgm_ops");
            entity.HasIndex(e => e.Description).HasMethod("gin").HasOperators("gin_trgm_ops");
            entity.HasIndex(e => new { e.ProjectId, e.FindingKind, e.FindingKey })
                .IsUnique()
                .HasFilter("\"FindingKey\" IS NOT NULL AND \"Status\" IN ('New', 'InProgress', 'Testing')");

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
            entity.HasIndex(e => e.Content).HasMethod("gin").HasOperators("gin_trgm_ops");

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

    private static void ConfigureTicketAttachment(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TicketAttachment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FileName).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Content).HasColumnType("bytea");
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
}
