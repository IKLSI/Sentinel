using ClosedXML.Excel;
using Microsoft.Extensions.Logging;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
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

    private const int TitleRow = 1;
    private const int MetaRow = 2;
    private const int HeaderRow = 3;
    private const int FirstDataRow = 4;

    private async Task<ExportLabels> GetLabelsAsync(Guid currentUserId, CancellationToken cancellationToken)
    {
        string? lang = await userRepository.GetLanguageOrDefaultAsync(currentUserId, cancellationToken);

        return ExportLabels.For(localizer, lang ?? LanguageValues.Fr);
    }

    public async Task<ExportResult> ExportTicketsExcelAsync(
        Guid organizationId, TicketFilter filter, Guid currentUserId, CancellationToken cancellationToken)
    {
        List<TicketGridRow> tickets = (await ticketRepository.ListForExportAsync(
            organizationId, filter, ExportLimits.MaxTicketRows + 1, cancellationToken)).ToList();

        bool truncated = tickets.Count > ExportLimits.MaxTicketRows;

        if (truncated)
        {
            tickets.RemoveRange(ExportLimits.MaxTicketRows, tickets.Count - ExportLimits.MaxTicketRows);

            logger.LogWarning("Ticket export for {OrganizationId} truncated at {MaxRows} rows",
                organizationId, ExportLimits.MaxTicketRows);
        }

        ExportLabels labels = await GetLabelsAsync(currentUserId, cancellationToken);

        byte[] bytes = WriteTicketsExcel(tickets, labels, truncated);
        return new ExportResult(bytes, $"tickets-{DateTime.UtcNow:yyyy-MM-dd}.xlsx");
    }

    public async Task<ExportResult> ExportTechHealthExcelAsync(Guid organizationId, Guid currentUserId,
        CancellationToken cancellationToken)
    {
        List<Project> projects = (await projectRepository.ListWithHealthDetailsByNameAsync(
            organizationId, ExportLimits.MaxProjectSheets + 1, cancellationToken)).ToList();

        bool truncated = projects.Count > ExportLimits.MaxProjectSheets;

        if (truncated)
        {
            projects.RemoveRange(ExportLimits.MaxProjectSheets, projects.Count - ExportLimits.MaxProjectSheets);

            logger.LogWarning("Tech health export for {OrganizationId} truncated at {MaxProjects} projects",
                organizationId, ExportLimits.MaxProjectSheets);
        }

        ExportLabels labels = await GetLabelsAsync(currentUserId, cancellationToken);

        byte[] bytes = WriteTechHealthExcel(projects, labels, truncated);
        return new ExportResult(bytes, $"{labels.TechHealthSlug}-{DateTime.UtcNow:yyyy-MM-dd}.xlsx");
    }

    private static string ComposeName(string? firstName, string? lastName) =>
        firstName == null && lastName == null ? string.Empty : $"{firstName} {lastName}".Trim();

    private byte[] WriteTicketsExcel(List<TicketGridRow> tickets, ExportLabels L, bool truncated)
    {
        string[] headers = L.TicketHeaders;

        using XLWorkbook workbook = new();
        ApplyDocumentProperties(workbook, L.SubjectTickets);
        IXLWorksheet ws = workbook.Worksheets.Add(L.SheetTickets);

        ApplyTitle(ws, L.TitleTickets, headers.Length);
        ApplyMetaRow(ws, headers.Length, BuildMeta(L, $"{tickets.Count} {L.UnitTickets}",
            truncated ? $"{L.ExportTruncated} {ExportLimits.MaxTicketRows}" : null));
        ApplyHeadersAtRow(ws, headers, HeaderRow);

        for (int i = 0; i < tickets.Count; i++)
        {
            TicketGridRow t = tickets[i];
            int row = i + FirstDataRow;

            SetRowBackground(ws, row, headers.Length, i % 2 == 1 ? AltRowColor : XLColor.White);

            ws.Cell(row, 1).Value = $"TKT-{t.Id.ToString().Replace("-", "")[..6].ToUpper()}";
            ws.Cell(row, 2).Value = t.Title;

            (_, XLColor stFg) = TicketStatusColor(t.Status);
            ApplyStatusCell(ws.Cell(row, 3), TranslateTicketStatus(t.Status.ToString(), L), stFg);

            (_, XLColor prFg) = TicketPriorityColor(t.Priority.ToString());
            ApplyStatusCell(ws.Cell(row, 4), TranslateTicketPriority(t.Priority.ToString(), L), prFg);

            ws.Cell(row, 5).Value = TranslateTicketType(t.Type.ToString(), L);
            ws.Cell(row, 6).Value = ComposeName(t.AssignedToFirstName, t.AssignedToLastName);
            ws.Cell(row, 7).Value = t.ProjectName ?? string.Empty;
            ws.Cell(row, 8).Value = ComposeName(t.CreatedByFirstName, t.CreatedByLastName);

            SetDateCell(ws.Cell(row, 9), t.CreatedAt, L.DateFormat);
            SetDateCell(ws.Cell(row, 10), t.UpdatedAt, L.DateFormat);
        }

        int lastDataRow = tickets.Count > 0 ? tickets.Count + FirstDataRow - 1 : HeaderRow;

        if (tickets.Count > 0)
        {
            int totalsRow = lastDataRow + 1;
            ApplyTotalsRow(ws, totalsRow, headers.Length);
            ws.Range(totalsRow, 1, totalsRow, headers.Length).Merge();
            ws.Cell(totalsRow, 1).Value = $"{L.TotalWord} — {tickets.Count} {L.UnitTickets}";
        }

        FinalizeSheet(ws, headers.Length, HeaderRow, HeaderRow, lastDataRow, HeaderRow);
        return SaveWorkbook(workbook);
    }

    private byte[] WriteTechHealthExcel(List<Project> projects, ExportLabels L, bool truncated)
    {
        using XLWorkbook workbook = new();
        ApplyDocumentProperties(workbook, L.SubjectTechHealth);
        WriteRecapSheet(workbook, projects, L, truncated);
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
