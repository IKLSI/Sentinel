namespace Sentinel.Domain.DTOs.Tickets;

public class TicketDto
{
    public Guid Id { get; set; }
    public Guid? ProjectId { get; set; }
    public string? ProjectName { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string StatusId { get; set; } = string.Empty;
    public string StatusName { get; set; } = string.Empty;
    public string StatusColor { get; set; } = string.Empty;
    public bool StatusIsClosed { get; set; }
    public Guid? AssignedToId { get; set; }
    public string? AssignedToName { get; set; }
    public decimal? EstimatedHours { get; set; }
    public Guid CreatedById { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<string> Tags { get; set; } = new();
    public List<TicketCommentDto> Comments { get; set; } = new();
    public List<TicketHistoryDto> History { get; set; } = new();
    public decimal TotalTimeMinutes { get; set; }
}

public class TicketCommentDto
{
    public Guid Id { get; set; }
    public Guid AuthorId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class TicketHistoryDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Field { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateCommentDto
{
    public string Content { get; set; } = string.Empty;
}

public class ChangeStatusDto
{
    public Guid StatusId { get; set; }
}
