namespace TMAflow.Domain.DTOs.Dashboard;

public class ActivityItemDto
{
    public string Color { get; set; } = "accent";
    public string Text { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string? Detail { get; set; }
}
