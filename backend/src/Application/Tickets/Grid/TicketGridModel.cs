namespace Sentinel.Application.Tickets.Grid;

public class TicketGridModel
{
    public const int SearchMaxLength = 100;
    public const int MaxPageSize = 100;
    public const int DefaultPageSize = 20;

    public string? Priority { get; set; }
    public string? Status { get; set; }
    public Guid? AssignedTo { get; set; }
    public string? Type { get; set; }
    public string? Search { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = DefaultPageSize;

    public int NormalizedPage => Page < 1 ? 1 : Page;

    public int NormalizedPageSize => PageSize switch
    {
        < 1 => DefaultPageSize,
        > MaxPageSize => MaxPageSize,
        _ => PageSize
    };
}
