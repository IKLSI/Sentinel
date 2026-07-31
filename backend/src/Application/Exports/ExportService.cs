using ClosedXML.Excel;
using Microsoft.Extensions.Logging;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Exports;

public sealed record ExportResult(byte[] Content, string FileName);

public partial class ExportService(
    ITicketRepository ticketRepository,
    IProjectRepository projectRepository,
    IUserRepository userRepository,
    ILocalizer localizer,
    ILogger<ExportService> logger)
{
    private const string BaseFont = "Segoe UI";
    private const string HoursFormat = "0.00 \"h\"";

    private const int TitleRow = 1;
    private const int MetaRow = 2;
    private const int HeaderRow = 3;
    private const int FirstDataRow = 4;

    private async Task<ExportLabels> GetLabelsAsync(Guid currentUserId, CancellationToken cancellationToken = default)
    {
        string? lang = await userRepository.GetLanguageOrDefaultAsync(currentUserId, cancellationToken);

        return ExportLabels.For(localizer, lang ?? LanguageValues.Fr);
    }

    public async Task<ExportResult> ExportTicketsExcelAsync(
        Guid organizationId, string? status, string? priority, Guid? assignedTo, string? type, string? search, Guid currentUserId)
    {
        TicketFilter filter = new()
        {
            Priority = !string.IsNullOrEmpty(priority)
                && Enum.TryParse(priority, true, out TicketPriority parsedPriority) ? parsedPriority : null,
            Status = !string.IsNullOrEmpty(status)
                && Enum.TryParse(status, true, out TicketStatus parsedStatus)
                ? parsedStatus
                : null,
            AssignedToId = assignedTo,
            Type = !string.IsNullOrEmpty(type) && Enum.TryParse(type, true, out TicketType parsedType)
                ? parsedType
                : null,
            Search = !string.IsNullOrWhiteSpace(search) && search.Length <= 100 ? search : null
        };

        List<Ticket> tickets =
            (await ticketRepository.ListForExportAsync(organizationId, filter, CancellationToken.None)).ToList();

        if (tickets.Count == ExportLimits.MaxTicketRows)
        {
            logger.LogWarning("Ticket export for {OrganizationId} truncated at {MaxRows} rows",
                organizationId, ExportLimits.MaxTicketRows);
        }

        ExportLabels labels = await GetLabelsAsync(currentUserId);

        byte[] bytes = WriteTicketsExcel(tickets, labels);
        return new ExportResult(bytes, $"tickets-{DateTime.UtcNow:yyyy-MM-dd}.xlsx");
    }

    public async Task<ExportResult> ExportTechHealthExcelAsync(Guid organizationId, Guid currentUserId)
    {
        List<Project> projects =
            (await projectRepository.ListWithHealthDetailsByNameAsync(organizationId, CancellationToken.None)).ToList();

        ExportLabels labels = await GetLabelsAsync(currentUserId);

        byte[] bytes = WriteTechHealthExcel(projects, labels);
        return new ExportResult(bytes, $"{labels.TechHealthSlug}-{DateTime.Now:yyyy-MM-dd}.xlsx");
    }

    private byte[] WriteTicketsExcel(List<Ticket> tickets, ExportLabels L)
    {
        string[] headers = L.TicketHeaders;

        using XLWorkbook workbook = new();
        ApplyDocumentProperties(workbook, L.SubjectTickets);
        IXLWorksheet ws = workbook.Worksheets.Add(L.SheetTickets);

        ApplyTitle(ws, L.TitleTickets, headers.Length);
        ApplyMetaRow(ws, headers.Length, BuildMeta(L, $"{tickets.Count} {L.UnitTickets}", null));
        ApplyHeadersAtRow(ws, headers, HeaderRow);

        for (int i = 0; i < tickets.Count; i++)
        {
            Ticket t = tickets[i];
            int row = i + FirstDataRow;

            SetRowBackground(ws, row, headers.Length, i % 2 == 1 ? AltRowColor : XLColor.White);

            ws.Cell(row, 1).Value = $"TKT-{t.Id.ToString().Replace("-", "")[..6].ToUpper()}";
            ws.Cell(row, 2).Value = t.Title;

            (_, XLColor stFg) = TicketStatusColor(t.Status);
            ApplyStatusCell(ws.Cell(row, 3), TranslateTicketStatus(t.Status.ToString(), L), stFg);

            (_, XLColor prFg) = TicketPriorityColor(t.Priority.ToString());
            ApplyStatusCell(ws.Cell(row, 4), TranslateTicketPriority(t.Priority.ToString(), L), prFg);

            ws.Cell(row, 5).Value = TranslateTicketType(t.Type.ToString(), L);
            ws.Cell(row, 6).Value = t.AssignedTo?.FullName ?? string.Empty;
            ws.Cell(row, 7).Value = t.Project?.Name ?? string.Empty;
            ws.Cell(row, 8).Value = t.CreatedBy?.FullName ?? string.Empty;

            SetDateCell(ws.Cell(row, 9), t.CreatedAt, L.DateFormat);
            SetDateCell(ws.Cell(row, 10), t.UpdatedAt, L.DateFormat);

            if (t.EstimatedHours.HasValue)
            {
                ws.Cell(row, 11).Value = (double)t.EstimatedHours.Value;
                ws.Cell(row, 11).Style.NumberFormat.Format = HoursFormat;
            }
        }

        int lastDataRow = tickets.Count > 0 ? tickets.Count + FirstDataRow - 1 : HeaderRow;

        if (tickets.Count > 0)
        {
            int totalsRow = lastDataRow + 1;
            ApplyTotalsRow(ws, totalsRow, headers.Length);
            ws.Range(totalsRow, 1, totalsRow, 10).Merge();
            ws.Cell(totalsRow, 1).Value = $"{L.TotalWord} — {tickets.Count} {L.UnitTickets}";
            ws.Cell(totalsRow, 11).Value = tickets.Where(t => t.EstimatedHours.HasValue).Sum(t => (double)t.EstimatedHours!.Value);
            ws.Cell(totalsRow, 11).Style.NumberFormat.Format = HoursFormat;
        }

        FinalizeSheet(ws, headers.Length, HeaderRow, HeaderRow, lastDataRow, HeaderRow);
        return SaveWorkbook(workbook);
    }

    private byte[] WriteTechHealthExcel(List<Project> projects, ExportLabels L)
    {
        using XLWorkbook workbook = new();
        ApplyDocumentProperties(workbook, L.SubjectTechHealth);
        WriteRecapSheet(workbook, projects, L);
        Dictionary<string, int> usedNames = [];
        foreach (Project project in projects)
        {
            string baseName = SafeSheetName(project.Name);
            if (!usedNames.TryAdd(baseName, 1))
            {
                int count = usedNames[baseName] + 1;
                usedNames[baseName] = count;
                string suffix = $"_{count}";
                baseName = baseName.Length + suffix.Length > 28
                    ? baseName[..(28 - suffix.Length)] + suffix
                    : baseName + suffix;
            }
            WriteProjectSheet(workbook, project, baseName, L);
        }
        return SaveWorkbook(workbook);
    }

}
