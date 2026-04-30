namespace Sentinel.Domain.Models;

public class TimeEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? TicketId { get; set; }
    public Guid? TechProjectId { get; set; }
    public Guid UserId { get; set; }
    public DateOnly Date { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);
    public int DurationMinutes { get; set; }
    public string? Comment { get; set; }

    public Ticket? Ticket { get; set; }
    public TechProject? TechProject { get; set; }
    public User User { get; set; } = null!;
}
