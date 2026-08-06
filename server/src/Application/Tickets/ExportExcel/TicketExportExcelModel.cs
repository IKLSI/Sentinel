namespace Sentinel.Application.Tickets.ExportExcel;

public class TicketExportExcelModel
{
    public string? Priority { get; set; }
    public string? Status { get; set; }
    public Guid? AssignedTo { get; set; }
    public string? Type { get; set; }
    public string? Search { get; set; }
}
