namespace Sentinel.Domain.DTOs.Sprints;

public class SprintDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Goal { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public int TicketCount { get; set; }
    public int CompletedCount { get; set; }
    public DateTime CreatedAt { get; set; }
}
