namespace Sentinel.Application.Tickets.Grid;

public class TicketGridModel
{
    public const int SearchMaxLength = 100;

    public string? Priority { get; set; }
    public string? Status { get; set; }
    public Guid? AssignedTo { get; set; }
    public string? Type { get; set; }
    public string? Search { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
