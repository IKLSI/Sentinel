namespace Sentinel.Domain.DTOs.Kanban;

public class KanbanColumnDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public int Order { get; set; }
    public int TicketCount { get; set; }
}

public class CreateKanbanColumnDto
{
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "var(--muted2)";
}

public class MoveTicketToColumnDto
{
    public Guid? ColumnId { get; set; }
}
