namespace Sentinel.Application.Tickets;

public class TicketDto
{
    public Guid Id { get; set; }
    public string Reference { get; set; } = string.Empty;
    public Guid? ProjectId { get; set; }
    public string? ProjectName { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public Guid? AssignedToId { get; set; }
    public string? AssignedToName { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int CommentCount { get; set; }
    public string? FindingKind { get; set; }
    public string? FindingKey { get; set; }
    public List<TicketCommentDto> Comments { get; set; } = new();
    public List<TicketHistoryDto> History { get; set; } = new();
}

public class TicketCommentDto
{
    public Guid Id { get; set; }
    public Guid AuthorId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class TicketHistoryDto
{
    public Guid Id { get; set; }
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
