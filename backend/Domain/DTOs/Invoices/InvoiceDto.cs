namespace TMAflow.Domain.DTOs.Invoices;

public class InvoiceDto
{
    public Guid Id { get; set; }
    public string Reference { get; set; } = string.Empty;
    public Guid OrganizationId { get; set; }
    public Guid? TechProjectId { get; set; }
    public string? TechProjectName { get; set; }
    public string Label { get; set; } = string.Empty;
    public string Period { get; set; } = string.Empty;
    public decimal TotalHours { get; set; }
    public decimal DailyRate { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal TaxRate { get; set; }
    public decimal TaxAmount => Math.Round(TotalAmount * TaxRate / 100, 2);
    public decimal TotalWithTax => Math.Round(TotalAmount + TaxAmount, 2);
    public string Status { get; set; } = string.Empty;
    public DateTime IssuedAt { get; set; }
    public DateTime? DueAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public bool HasPdf { get; set; }
    public bool IsOverdue => Status == "Sent" && DueAt.HasValue && DueAt.Value < DateTime.UtcNow;
}

public class GenerateInvoiceDto
{
    public Guid OrganizationId { get; set; }
    public Guid? TechProjectId { get; set; }
    public string Label { get; set; } = string.Empty;
    public decimal DailyRate { get; set; }
    public string Period { get; set; } = string.Empty;
    public decimal TaxRate { get; set; } = 20;
    public int DueDays { get; set; } = 30;
}
