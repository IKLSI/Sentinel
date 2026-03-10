namespace TMAflow.Domain.DTOs.Reports;

public class GenerateReportRequest
{
    public string Type { get; set; } = "monthly";
    public string PeriodStart { get; set; } = string.Empty;
    public string PeriodEnd { get; set; } = string.Empty;
    public bool SendByEmail { get; set; } = false;
}
