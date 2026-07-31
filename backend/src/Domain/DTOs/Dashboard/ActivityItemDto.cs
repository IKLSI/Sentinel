namespace Sentinel.Domain.DTOs.Dashboard;

public class ActivityItemDto
{
    public string Color { get; set; } = "accent";
    public DateTime Timestamp { get; set; }
    public string? Detail { get; set; }
    public string? TicketId { get; set; }
    public string? ProjectId { get; set; }
    public int? Count { get; set; }
    public string? Type { get; set; }
    public string? Reference { get; set; }
    public string? ProjectName { get; set; }
    public string? VulnCveId { get; set; }
    public int? VulnOtherCount { get; set; }
    public double? VulnCvssScore { get; set; }
}
