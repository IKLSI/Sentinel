namespace Sentinel.Domain.Models;

public class KanbanColumn
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "var(--muted2)";
    public int Order { get; set; }
    public Organization Organization { get; set; } = null!;
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
