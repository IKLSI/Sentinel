namespace Sentinel.Application.TechHealth.Suppressions;

public class SuppressionDto
{
    public Guid Id { get; set; }
    public string FindingKey { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
