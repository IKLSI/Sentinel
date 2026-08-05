using Sentinel.Domain.Abstractions.Persistence;
namespace Sentinel.Domain.Entities;

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

public enum TicketStatus
{
    New,
    InProgress,
    Testing,
    Resolved,
    Closed
}

public static class TicketStatusRules
{
    public static IReadOnlyList<TicketStatus> Open { get; } =
        [TicketStatus.New, TicketStatus.InProgress, TicketStatus.Testing];

    public static IReadOnlyList<TicketStatus> Closed { get; } =
        [TicketStatus.Resolved, TicketStatus.Closed];
}

public class Ticket : IEntityWithId
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public int Number { get; set; }
    public Guid OrganizationId { get; set; }
    public Guid? ProjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public TicketPriority Priority { get; set; } = TicketPriority.Medium;
    public int PriorityRank { get; private set; }
    public TicketType Type { get; set; } = TicketType.Bug;
    public TicketStatus Status { get; set; } = TicketStatus.New;
    public Guid? AssignedToId { get; set; }
    public Guid CreatedById { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public Organization Organization { get; set; } = null!;
    public Project? Project { get; set; }
    public User? AssignedTo { get; set; }
    public User CreatedBy { get; set; } = null!;
    public ICollection<TicketComment> Comments { get; set; } = new List<TicketComment>();
    public ICollection<TicketHistory> History { get; set; } = new List<TicketHistory>();
    public ICollection<TicketAttachment> Attachments { get; set; } = new List<TicketAttachment>();
}
