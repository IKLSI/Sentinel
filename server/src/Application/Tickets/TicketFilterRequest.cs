namespace Sentinel.Application.Tickets;

public class TicketFilterRequest
{
    public const int SearchMaxLength = 100;
    public const int MaxValuesPerField = 20;

    public string[] Priority { get; set; } = [];
    public string[] Status { get; set; } = [];
    public string[] Type { get; set; } = [];
    public string[] AssignedTo { get; set; } = [];
    public string[] Project { get; set; } = [];
    public string? Search { get; set; }
}
