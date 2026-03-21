namespace Sentinel.Domain.Models;

public enum InvoiceStatus
{
    Draft,
    Sent,
    Paid
}

public class Invoice
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public Guid? TechProjectId { get; set; }
    public string Label { get; set; } = string.Empty;
    public string Period { get; set; } = string.Empty;
    public decimal TotalHours { get; set; }
    public decimal DailyRate { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal TaxRate { get; set; } = 20;
    public int InvoiceNumber { get; set; }
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;
    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DueAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public byte[]? PdfData { get; set; }

    public Organization Organization { get; set; } = null!;
    public TechProject? TechProject { get; set; }
}
