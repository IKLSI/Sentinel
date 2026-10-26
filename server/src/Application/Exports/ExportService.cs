using ClosedXML.Excel;
using Microsoft.Extensions.Logging;
using Sentinel.Application.Tickets;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.Exports;

public sealed record ExportResult(byte[] Content, string FileName);

public partial class ExportService(
    ITicketRepository ticketRepository,
    IProjectRepository projectRepository,
    IUserRepository userRepository,
    IVulnerabilitySuppressionRepository suppressionRepository,
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
        IReadOnlyList<TicketExportRow> rows = await ticketRepository.ListForExportAsync(
            organizationId, filter, ExportLimits.MaxTicketRows + 1, cancellationToken);
        (List<TicketExportRow> tickets, bool truncated) = ExportLimits.Cap(rows, ExportLimits.MaxTicketRows);

        if (truncated)
        {
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
        IReadOnlyList<Project> rows = await projectRepository.ListWithHealthDetailsByNameAsync(
            organizationId, ExportLimits.MaxProjectSheets + 1, cancellationToken);
        (List<Project> projects, bool truncated) = ExportLimits.Cap(rows, ExportLimits.MaxProjectSheets);

        if (truncated)
        {
            logger.LogWarning("Tech health export for {OrganizationId} truncated at {MaxProjects} projects",
                organizationId, ExportLimits.MaxProjectSheets);
        }

        await ExcludeSuppressedVulnerabilitiesAsync(projects, cancellationToken);

        ExportLabels labels = await GetLabelsAsync(currentUserId, cancellationToken);

        byte[] bytes = WriteTechHealthExcel(projects, labels, truncated);
        return new ExportResult(bytes, $"{labels.TechHealthSlug}-{DateTime.UtcNow:yyyy-MM-dd}.xlsx");
    }

    private async Task ExcludeSuppressedVulnerabilitiesAsync(List<Project> projects,
        CancellationToken cancellationToken)
    {
        IReadOnlyDictionary<Guid, IReadOnlySet<string>> suppressedKeysByProject = await suppressionRepository
            .ListActiveFindingKeysByProjectAsync(projects.Select(project => project.Id).ToList(), DateTime.UtcNow,
                cancellationToken);

        foreach (Project project in projects)
        {
            HashSet<Guid> suppressedIds =
                SuppressedVulnerabilities.IdsIn(project, suppressedKeysByProject[project.Id]);

            foreach (Dependency dependency in project.Dependencies)
            {
                dependency.Vulnerabilities = dependency.Vulnerabilities
                    .Where(vulnerability => !suppressedIds.Contains(vulnerability.Id))
                    .ToList();
            }
        }
    }

    private byte[] WriteTicketsExcel(List<TicketExportRow> tickets, ExportLabels L, bool truncated)
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
            TicketExportRow t = tickets[i];
            int row = i + FirstDataRow;

            SetRowBackground(ws, row, headers.Length, i % 2 == 1 ? AltRowColor : XLColor.White);

            ws.Cell(row, 1).Value = TicketReference.For(t.Number);
            ws.Cell(row, 2).Value = t.Title;

            ApplyStatusCell(ws.Cell(row, 3), TranslateTicketStatus(t.Status, L), TicketStatusColor(t.Status));
            ApplyStatusCell(ws.Cell(row, 4), TranslateTicketPriority(t.Priority, L), TicketPriorityColor(t.Priority));

            ws.Cell(row, 5).Value = TranslateTicketType(t.Type, L);
            ws.Cell(row, 6).Value = PersonName.Format(t.AssignedToFirstName, t.AssignedToLastName) ?? string.Empty;
            ws.Cell(row, 7).Value = t.ProjectName ?? string.Empty;
            ws.Cell(row, 8).Value = PersonName.Format(t.CreatedByFirstName, t.CreatedByLastName) ?? string.Empty;

            SetDateCell(ws.Cell(row, 9), t.CreatedAt, L.DateFormat);
            SetDateCell(ws.Cell(row, 10), t.UpdatedAt, L.DateFormat);
        }

        int lastDataRow = tickets.Count > 0 ? tickets.Count + FirstDataRow - 1 : HeaderRow;
        ApplyDataBlockStyle(ws, FirstDataRow, lastDataRow, headers.Length);

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
        HashSet<string> usedNames = new(StringComparer.OrdinalIgnoreCase) { L.SheetRecap };
        foreach (Project project in projects.Where(HasInventory))
        {
            string baseName = SafeSheetName(project.Name);
            string sheetName = baseName;
            for (int count = 2; !usedNames.Add(sheetName); count++)
            {
                string suffix = $"_{count}";
                sheetName = baseName.Length + suffix.Length > 28
                    ? baseName[..(28 - suffix.Length)] + suffix
                    : baseName + suffix;
            }
            WriteProjectSheet(workbook, project, sheetName, L);
        }
        return SaveWorkbook(workbook);
    }

    private static bool HasInventory(Project project) =>
        project.Dependencies.Count > 0 || project.Runtimes.Count > 0;

}
