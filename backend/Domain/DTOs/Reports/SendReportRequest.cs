namespace TMAflow.Domain.DTOs.Reports;

public class SendReportRequest
{
    public string RecipientEmail { get; set; } = string.Empty;
    public string RecipientName { get; set; } = string.Empty;
}
