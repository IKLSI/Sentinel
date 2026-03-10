namespace TMAflow.Domain.Models;

public class Report
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public string Period { get; set; } = string.Empty;
    public string ReportType { get; set; } = "monthly";
    public string? PeriodStart { get; set; }
    public string? PeriodEnd { get; set; }
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    public string? PdfPath { get; set; }
    public DateTime? SentAt { get; set; }
    public string? EmailSentTo { get; set; }

    public Organization Organization { get; set; } = null!;
}
