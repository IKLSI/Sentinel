namespace Sentinel.Domain.DTOs.TimeEntries;

public class TimeEntryDto
{
    public Guid Id { get; set; }
    public Guid? TicketId { get; set; }
    public string? TicketTitle { get; set; }
    public Guid? TechProjectId { get; set; }
    public string? TechProjectName { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserRole { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public int DurationMinutes { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
}

public class CreateTimeEntryDto
{
    public Guid? TicketId { get; set; }
    public Guid? TechProjectId { get; set; }
    public DateOnly Date { get; set; }
    public int DurationMinutes { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
}

public class UpdateTimeEntryDto
{
    public DateOnly? Date { get; set; }
    public int? DurationMinutes { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public Guid? TechProjectId { get; set; }
    public Guid? TicketId { get; set; }
}
