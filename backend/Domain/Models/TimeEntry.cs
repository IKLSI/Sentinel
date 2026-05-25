namespace Sentinel.Domain.Models;

public class TimeEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? TicketId { get; set; }
    public Guid? ProjectId { get; set; }
    public Guid UserId { get; set; }
    public DateOnly Date { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);
    public int DurationMinutes { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }

    public Ticket? Ticket { get; set; }
    public Project? Project { get; set; }
    public User User { get; set; } = null!;
}
