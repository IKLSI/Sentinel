namespace Sentinel.Domain.Models;

public enum TicketPriority
{
    Low,
    Medium,
    High,
    Critical
}

public enum TicketType
{
    Bug,
    Feature,
    Question,
    Security,
    Performance,
    Maintenance
}



public class Ticket
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public Guid? ProjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public TicketPriority Priority { get; set; } = TicketPriority.Medium;
    public TicketType Type { get; set; } = TicketType.Bug;
    // Status is a dynamic string (e.g. "new", "in_progress", or custom statuses)
    public string Status { get; set; } = "new";
    public Guid? AssignedToId { get; set; }
    public decimal? EstimatedHours { get; set; }
    public Guid CreatedById { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool IsInternal { get; set; } = false;
    public string Tags { get; set; } = "[]";
    public Guid? KanbanColumnId { get; set; }
    public KanbanColumn? KanbanColumn { get; set; }
    public Organization Organization { get; set; } = null!;
    public TechProject? Project { get; set; }
    public User? AssignedTo { get; set; }
    public User CreatedBy { get; set; } = null!;
    public ICollection<TicketComment> Comments { get; set; } = new List<TicketComment>();
    public ICollection<TicketHistory> History { get; set; } = new List<TicketHistory>();
    public ICollection<TimeEntry> TimeEntries { get; set; } = new List<TimeEntry>();

    public string[] GetTags()
    {
        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<string[]>(Tags) ?? [];
        }
        catch
        {
            return [];
        }
    }
}
