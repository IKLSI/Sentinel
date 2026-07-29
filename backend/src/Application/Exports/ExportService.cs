using ClosedXML.Excel;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Exports;

public sealed record ExportResult(byte[] Content, string FileName);

public class ExportService(
    ITicketRepository ticketRepository,
    IProjectRepository projectRepository,
    IUserRepository userRepository)
{
    private const string BaseFont = "Segoe UI";
    private const string HoursFormat = "0.00 \"h\"";

    private const int TitleRow = 1;
    private const int MetaRow = 2;
    private const int HeaderRow = 3;
    private const int FirstDataRow = 4;

    private static readonly XLColor BrandIndigo = XLColor.FromHtml("#6366F1");
    private static readonly XLColor BrandIndigoDeep = XLColor.FromHtml("#4F46E5");
    private static readonly XLColor SoftIndigoFill = XLColor.FromHtml("#E0E7FF");
    private static readonly XLColor MetaFill = XLColor.FromHtml("#EEF0FE");
    private static readonly XLColor HeaderText = XLColor.FromHtml("#1E293B");
    private static readonly XLColor MetaFg = XLColor.FromHtml("#64748B");
    private static readonly XLColor TotalBg = XLColor.FromHtml("#E0E7FF");
    private static readonly XLColor TotalFg = XLColor.FromHtml("#334155");
    private static readonly XLColor LinkColor = XLColor.FromHtml("#4F46E5");
    private static readonly XLColor AltRowColor = XLColor.FromHtml("#F1F3FD");
    private static readonly XLColor BorderColor = XLColor.FromHtml("#E2E8F0");

    private static readonly XLColor GreenBg = XLColor.FromHtml("#DCFCE7");
    private static readonly XLColor GreenFg = XLColor.FromHtml("#15803D");
    private static readonly XLColor GreenBg2 = XLColor.FromHtml("#D1FAE5");
    private static readonly XLColor GreenFg2 = XLColor.FromHtml("#16A34A");
    private static readonly XLColor GrayBg = XLColor.FromHtml("#F1F5F9");
    private static readonly XLColor GrayFg = XLColor.FromHtml("#475569");
    private static readonly XLColor OrangeBg = XLColor.FromHtml("#FFEDD5");
    private static readonly XLColor OrangeFg = XLColor.FromHtml("#C2410C");
    private static readonly XLColor YellowBg = XLColor.FromHtml("#FEF3C7");
    private static readonly XLColor YellowFg = XLColor.FromHtml("#B45309");
    private static readonly XLColor RedBg = XLColor.FromHtml("#FEE2E2");
    private static readonly XLColor RedFg = XLColor.FromHtml("#B91C1C");

    private async Task<ExportLabels> GetLabelsAsync(Guid currentUserId, CancellationToken cancellationToken = default)
    {
        string? lang = await userRepository.GetLanguageOrDefaultAsync(currentUserId, cancellationToken);

        return ExportLabels.For(lang == LanguageValues.En);
    }

    public async Task<ExportResult> ExportTicketsExcelAsync(
        Guid organizationId, string? status, string? priority, Guid? assignedTo, string? type, string? search, Guid currentUserId)
    {
        TicketFilter filter = new()
        {
            Priority = !string.IsNullOrEmpty(priority)
                && Enum.TryParse(priority, true, out TicketPriority parsedPriority) ? parsedPriority : null,
            TicketStatusId = !string.IsNullOrEmpty(status) && Guid.TryParse(status, out Guid statusGuid)
                ? statusGuid
                : null,
            AssignedToId = assignedTo,
            Type = !string.IsNullOrEmpty(type) && Enum.TryParse(type, true, out TicketType parsedType)
                ? parsedType
                : null,
            Search = !string.IsNullOrWhiteSpace(search) && search.Length <= 100 ? search : null
        };

        List<Ticket> tickets =
            (await ticketRepository.ListForExportAsync(organizationId, filter, CancellationToken.None)).ToList();

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
        string slug = labels.IsEn ? "tech-health" : "sante-technique";
        return new ExportResult(bytes, $"{slug}-{DateTime.Now:yyyy-MM-dd}.xlsx");
    }

    private static byte[] WriteTicketsExcel(List<Ticket> tickets, ExportLabels L)
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

            string statusName = t.TicketStatus?.Name ?? L.StatusUnknown;
            (_, XLColor stFg) = TicketStatusColor(t.TicketStatus?.Name ?? string.Empty);
            ApplyStatusCell(ws.Cell(row, 3), statusName, stFg);

            (_, XLColor prFg) = TicketPriorityColor(t.Priority.ToString());
            ApplyStatusCell(ws.Cell(row, 4), TranslateTicketPriority(t.Priority.ToString(), L.IsEn), prFg);

            ws.Cell(row, 5).Value = TranslateTicketType(t.Type.ToString(), L.IsEn);
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

    private static byte[] WriteTechHealthExcel(List<Project> projects, ExportLabels L)
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

    private static void WriteRecapSheet(XLWorkbook wb, List<Project> projects, ExportLabels L)
    {
        string[] headers = L.RecapHeaders;
        IXLWorksheet ws = wb.Worksheets.Add(L.SheetRecap);

        ApplyTitle(ws, L.TitleTechHealth, headers.Length);
        ApplyMetaRow(ws, headers.Length, BuildMeta(L, $"{projects.Count} {L.UnitProjects}", null));
        ApplyHeadersAtRow(ws, headers, HeaderRow);

        int sumDeps = 0, sumUpdate = 0, sumVuln = 0, sumCrit = 0, sumEol = 0;

        for (int i = 0; i < projects.Count; i++)
        {
            Project p = projects[i];
            int row = i + FirstDataRow;
            SetRowBackground(ws, row, headers.Length, i % 2 == 1 ? AltRowColor : XLColor.White);

            ws.Cell(row, 1).Value = p.Name;

            (_, XLColor grFg) = GradeColor(p.HealthGrade);
            ApplyStatusCell(ws.Cell(row, 2), p.HealthGrade ?? L.GradeNotAvailable, grFg);

            IXLCell scoreCell = ws.Cell(row, 3);
            scoreCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            if (p.HealthScore is { } score)
            {
                scoreCell.Value = score;
                scoreCell.Style.NumberFormat.Format = "0";
                (_, XLColor scoreFg) = ScoreColor(score);
                scoreCell.Style.Font.FontColor = scoreFg;
                scoreCell.Style.Font.Bold = true;
            }
            else
            {
                scoreCell.Value = L.GradeNotAvailable;
                scoreCell.Style.Font.FontColor = GrayFg;
            }

            int toUpdate = p.Dependencies.Count(d => d.Status == DependencyStatus.MinorUpdate || d.Status == DependencyStatus.MajorUpdate);
            int vulnerableDeps = p.Dependencies.Count(d => d.Vulnerabilities.Any());
            int criticals = p.Dependencies.SelectMany(d => d.Vulnerabilities).Count(v => v.Severity == VulnerabilitySeverity.Critical);
            int eolRuntimes = p.Runtimes.Count(r => r.IsEol);

            sumDeps += p.Dependencies.Count;
            sumUpdate += toUpdate;
            sumVuln += vulnerableDeps;
            sumCrit += criticals;
            sumEol += eolRuntimes;

            ws.Cell(row, 4).Value = p.Dependencies.Count;
            ws.Cell(row, 4).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            IXLCell updateCell = ws.Cell(row, 5);
            updateCell.Value = toUpdate;
            updateCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            if (toUpdate > 0) { updateCell.Style.Font.FontColor = OrangeFg; updateCell.Style.Font.Bold = true; }

            IXLCell vulnCell = ws.Cell(row, 6);
            vulnCell.Value = vulnerableDeps;
            vulnCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            if (vulnerableDeps > 0) { vulnCell.Style.Font.FontColor = OrangeFg; vulnCell.Style.Font.Bold = true; }

            IXLCell critCell = ws.Cell(row, 7);
            critCell.Value = criticals;
            critCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            if (criticals > 0) { critCell.Style.Font.FontColor = RedFg; critCell.Style.Font.Bold = true; }

            IXLCell eolCell = ws.Cell(row, 8);
            eolCell.Value = eolRuntimes;
            eolCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            if (eolRuntimes > 0) { eolCell.Style.Font.FontColor = RedFg; eolCell.Style.Font.Bold = true; }

            if (p.LastScanAt.HasValue)
                SetDateCell(ws.Cell(row, 9), p.LastScanAt.Value, L.DateFormat);
            else
            {
                ws.Cell(row, 9).Value = "—";
                ws.Cell(row, 9).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                ws.Cell(row, 9).Style.Font.FontColor = GrayFg;
            }
        }

        int lastDataRow = projects.Count > 0 ? projects.Count + FirstDataRow - 1 : HeaderRow;

        if (projects.Count > 0)
        {
            int totalsRow = lastDataRow + 1;
            ApplyTotalsRow(ws, totalsRow, headers.Length);
            ws.Range(totalsRow, 1, totalsRow, 3).Merge();
            ws.Cell(totalsRow, 1).Value = $"{L.TotalWord} — {projects.Count} {L.UnitProjects}";
            ws.Cell(totalsRow, 4).Value = sumDeps;
            ws.Cell(totalsRow, 5).Value = sumUpdate;
            ws.Cell(totalsRow, 6).Value = sumVuln;
            ws.Cell(totalsRow, 7).Value = sumCrit;
            ws.Cell(totalsRow, 8).Value = sumEol;
            ws.Cell(totalsRow, 9).Value = "—";
        }

        FinalizeSheet(ws, headers.Length, HeaderRow, HeaderRow, lastDataRow, HeaderRow);
    }

    private static void WriteProjectSheet(XLWorkbook wb, Project project, string sheetName, ExportLabels L)
    {
        IXLWorksheet ws = wb.Worksheets.Add(sheetName);

        int currentRow = 1;

        string[] runtimeHeaders = L.RuntimeHeaders;
        ApplySectionTitle(ws, currentRow, runtimeHeaders.Length, L.SectionRuntimes);
        currentRow++;
        ApplyHeadersAtRow(ws, runtimeHeaders, currentRow);
        currentRow++;

        List<Runtime> runtimes = project.Runtimes.OrderBy(r => r.Name).ToList();
        for (int i = 0; i < runtimes.Count; i++)
        {
            Runtime r = runtimes[i];
            SetRowBackground(ws, currentRow, runtimeHeaders.Length, i % 2 == 1 ? AltRowColor : XLColor.White);
            ws.Cell(currentRow, 1).Value = r.Name;
            ws.Cell(currentRow, 2).Value = r.Version;

            if (r.EolDate.HasValue)
                SetDateCell(ws.Cell(currentRow, 3), r.EolDate.Value, L.DateFormat);
            else
            {
                ws.Cell(currentRow, 3).Value = "—";
                ws.Cell(currentRow, 3).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                ws.Cell(currentRow, 3).Style.Font.FontColor = GrayFg;
            }

            (string rtLabel, XLColor rtFg) = RuntimeStatus(r, L);
            IXLCell statusCell = ws.Cell(currentRow, 4);
            statusCell.Value = rtLabel;
            statusCell.Style.Font.FontColor = rtFg;
            statusCell.Style.Font.Bold = true;
            statusCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            currentRow++;
        }

        if (runtimes.Count == 0)
        {
            IXLCell emptyCell = ws.Cell(currentRow, 1);
            emptyCell.Value = L.NoRuntimes;
            ws.Range(currentRow, 1, currentRow, runtimeHeaders.Length).Merge();
            emptyCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            emptyCell.Style.Font.FontColor = GrayFg;
            emptyCell.Style.Font.Italic = true;
            ws.Row(currentRow).Height = 18;
            currentRow++;
        }

        currentRow++;

        string[] depHeaders = L.DepHeaders;
        ApplySectionTitle(ws, currentRow, depHeaders.Length, L.SectionDependencies);
        currentRow++;
        ApplyHeadersAtRow(ws, depHeaders, currentRow);
        currentRow++;

        List<Dependency> deps = project.Dependencies
            .OrderBy(d => d.Status == DependencyStatus.UpToDate ? 1 : 0)
            .ThenBy(d => d.Name)
            .ToList();

        for (int i = 0; i < deps.Count; i++)
        {
            Dependency d = deps[i];
            SetRowBackground(ws, currentRow, depHeaders.Length, i % 2 == 1 ? AltRowColor : XLColor.White);

            ws.Cell(currentRow, 1).Value = d.Name;
            ws.Cell(currentRow, 2).Value = d.CurrentVersion;

            if (!string.IsNullOrEmpty(d.LatestVersion))
                ws.Cell(currentRow, 3).Value = d.LatestVersion;
            else
            {
                ws.Cell(currentRow, 3).Value = "—";
                ws.Cell(currentRow, 3).Style.Font.FontColor = GrayFg;
                ws.Cell(currentRow, 3).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            }

            ws.Cell(currentRow, 4).Value = d.Ecosystem.ToString();
            ws.Cell(currentRow, 5).Value = TranslateDependencyType(d.Type.ToString(), L.IsEn);

            (_, XLColor dsFg) = DepStatusColor(d.Status.ToString());
            ApplyStatusCell(ws.Cell(currentRow, 6), TranslateDependencyStatus(d.Status.ToString(), L.IsEn), dsFg);

            int vulnCount = d.Vulnerabilities.Count;
            IXLCell vulnCountCell = ws.Cell(currentRow, 7);
            vulnCountCell.Value = vulnCount;
            vulnCountCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            if (vulnCount > 0) { vulnCountCell.Style.Font.FontColor = RedFg; vulnCountCell.Style.Font.Bold = true; }

            currentRow++;
        }

        if (deps.Count == 0)
        {
            IXLCell emptyCell = ws.Cell(currentRow, 1);
            emptyCell.Value = L.NoDependencies;
            ws.Range(currentRow, 1, currentRow, depHeaders.Length).Merge();
            emptyCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            emptyCell.Style.Font.FontColor = GrayFg;
            emptyCell.Style.Font.Italic = true;
            ws.Row(currentRow).Height = 18;
            currentRow++;
        }

        currentRow++;

        string[] vulnHeaders = L.VulnHeaders;
        ApplySectionTitle(ws, currentRow, vulnHeaders.Length, L.SectionVulnerabilities);
        currentRow++;

        List<(Dependency dep, Vulnerability vuln)> vulnPairs = project.Dependencies
            .SelectMany(d => d.Vulnerabilities.Select(v => (dep: d, vuln: v)))
            .OrderByDescending(x => x.vuln.CvssScore)
            .ToList();

        if (vulnPairs.Count == 0)
        {
            ApplyHeadersAtRow(ws, vulnHeaders, currentRow);
            currentRow++;
            IXLCell noVulnCell = ws.Cell(currentRow, 1);
            noVulnCell.Value = L.NoVulnerabilities;
            ws.Range(currentRow, 1, currentRow, vulnHeaders.Length).Merge();
            noVulnCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            noVulnCell.Style.Font.FontColor = GreenFg;
            noVulnCell.Style.Font.Bold = true;
            ws.Row(currentRow).Height = 18;
        }
        else
        {
            ApplyHeadersAtRow(ws, vulnHeaders, currentRow);
            currentRow++;

            for (int i = 0; i < vulnPairs.Count; i++)
            {
                (Dependency dep, Vulnerability v) = vulnPairs[i];
                SetRowBackground(ws, currentRow, vulnHeaders.Length, i % 2 == 1 ? AltRowColor : XLColor.White, autoHeight: true);

                ws.Cell(currentRow, 1).Value = v.CveId;
                ws.Cell(currentRow, 1).Style.Font.FontColor = LinkColor;

                IXLCell cvssCell = ws.Cell(currentRow, 2);
                cvssCell.Value = (double)v.CvssScore;
                cvssCell.Style.NumberFormat.Format = "0.0";
                cvssCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                (_, XLColor sevFg) = SeverityColor(v.Severity.ToString());
                cvssCell.Style.Font.FontColor = sevFg;
                cvssCell.Style.Font.Bold = true;

                ApplyStatusCell(ws.Cell(currentRow, 3), TranslateSeverity(v.Severity.ToString(), L.IsEn), sevFg);

                ws.Cell(currentRow, 4).Value = dep.Name;

                if (!string.IsNullOrEmpty(v.FixedVersion))
                    ws.Cell(currentRow, 5).Value = v.FixedVersion;
                else
                {
                    ws.Cell(currentRow, 5).Value = "—";
                    ws.Cell(currentRow, 5).Style.Font.FontColor = GrayFg;
                    ws.Cell(currentRow, 5).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                }

                ws.Cell(currentRow, 6).Value = v.Description;
                ws.Cell(currentRow, 6).Style.Alignment.WrapText = true;

                currentRow++;
            }
        }

        FinalizeSheet(ws, Math.Max(runtimeHeaders.Length, Math.Max(depHeaders.Length, vulnHeaders.Length)), 0, 0, 0, 0);
    }

    private static string BuildMeta(ExportLabels L, string count, string? extra)
    {
        string stamp = L.IsEn
            ? $"{L.GeneratedOn} {DateTime.Now:MM/dd/yyyy} {L.AtWord} {DateTime.Now:HH:mm}"
            : $"{L.GeneratedOn} {DateTime.Now:dd/MM/yyyy} {L.AtWord} {DateTime.Now:HH:mm}";
        string baseMeta = $"{stamp} · {count}";
        return string.IsNullOrEmpty(extra) ? baseMeta : $"{baseMeta} · {extra}";
    }

    private static void ApplyDocumentProperties(XLWorkbook wb, string subject)
    {
        wb.Properties.Author = "Sentinel";
        wb.Properties.Company = "Sentinel";
        wb.Properties.Title = subject;
        wb.Properties.Subject = subject;
        wb.Properties.Category = "Export";
    }

    private static void ApplyTitle(IXLWorksheet ws, string title, int colCount)
    {
        ws.Range(TitleRow, 1, TitleRow, colCount).Merge();
        IXLCell cell = ws.Cell(TitleRow, 1);
        cell.Value = title;
        cell.Style.Fill.BackgroundColor = SoftIndigoFill;
        cell.Style.Font.FontColor = BrandIndigoDeep;
        cell.Style.Font.Bold = true;
        cell.Style.Font.FontSize = 15;
        cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
        cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        cell.Style.Alignment.Indent = 1;
        cell.Style.Border.BottomBorder = XLBorderStyleValues.Thick;
        cell.Style.Border.BottomBorderColor = BrandIndigo;
        ws.Row(TitleRow).Height = 30;
    }

    private static void ApplyMetaRow(IXLWorksheet ws, int colCount, string text)
    {
        ws.Range(MetaRow, 1, MetaRow, colCount).Merge();
        IXLCell cell = ws.Cell(MetaRow, 1);
        cell.Value = text;
        cell.Style.Fill.BackgroundColor = MetaFill;
        cell.Style.Font.FontColor = MetaFg;
        cell.Style.Font.FontSize = 9;
        cell.Style.Font.Italic = true;
        cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
        cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        cell.Style.Alignment.Indent = 1;
        ws.Row(MetaRow).Height = 16;
    }

    private static void SetRowBackground(IXLWorksheet ws, int row, int colCount, XLColor color, bool autoHeight = false)
    {
        IXLRange range = ws.Range(row, 1, row, colCount);
        range.Style.Fill.BackgroundColor = color;
        range.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        range.Style.Border.OutsideBorderColor = BorderColor;
        range.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
        range.Style.Border.InsideBorderColor = BorderColor;
        range.Style.Alignment.Vertical = autoHeight ? XLAlignmentVerticalValues.Top : XLAlignmentVerticalValues.Center;
        if (!autoHeight)
            ws.Row(row).Height = 18;
    }

    private static void ApplyTotalsRow(IXLWorksheet ws, int row, int colCount)
    {
        IXLRange range = ws.Range(row, 1, row, colCount);
        range.Style.Fill.BackgroundColor = TotalBg;
        range.Style.Font.FontColor = TotalFg;
        range.Style.Font.Bold = true;
        range.Style.Border.TopBorder = XLBorderStyleValues.Medium;
        range.Style.Border.TopBorderColor = BrandIndigo;
        range.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        range.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        ws.Row(row).Height = 20;
        ws.Cell(row, 1).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
        ws.Cell(row, 1).Style.Alignment.Indent = 1;
    }

    private static void SetDateCell(IXLCell cell, DateTime dt, string format)
    {
        cell.Value = dt;
        cell.Style.NumberFormat.Format = format;
    }

    private static void ApplyStatusCell(IXLCell cell, string value, XLColor fg)
    {
        cell.Value = value;
        cell.Style.Font.FontColor = fg;
        cell.Style.Font.Bold = true;
        cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
    }

    private static (XLColor bg, XLColor fg) TicketStatusColor(string statusName) => statusName switch
    {
        "Résolu" or "Fermé" => (GreenBg, GreenFg),
        "En cours" or "Tests" => (OrangeBg, OrangeFg),
        _ => (GrayBg, GrayFg),
    };

    private static (XLColor bg, XLColor fg) TicketPriorityColor(string priority) => priority switch
    {
        "Critical" => (RedBg, RedFg),
        "High" => (OrangeBg, OrangeFg),
        "Medium" => (YellowBg, YellowFg),
        _ => (GrayBg, GrayFg),
    };

    private static string TranslateTicketPriority(string priority, bool en) => priority switch
    {
        "Low" => en ? "Low" : "Faible",
        "Medium" => en ? "Medium" : "Moyen",
        "High" => en ? "High" : "Élevé",
        "Critical" => en ? "Critical" : "Critique",
        _ => priority,
    };

    private static string TranslateTicketType(string type, bool en) => type switch
    {
        "Feature" => en ? "Feature" : "Fonctionnalité",
        "Security" => en ? "Security" : "Sécurité",
        "Bug" => en ? "Bug" : "Bug",
        _ => type,
    };

    private static (string label, XLColor fg) RuntimeStatus(Runtime r, ExportLabels L)
    {
        if (r.IsEol)
            return (L.RuntimeEol, RedFg);
        if (r.EolDate.HasValue && r.EolDate.Value < DateTime.Now.AddMonths(6))
            return (L.RuntimeSoonEol, OrangeFg);
        return (L.RuntimeActive, GreenFg);
    }

    private static void ApplySectionTitle(IXLWorksheet ws, int row, int colCount, string title)
    {
        ws.Range(row, 1, row, colCount).Merge();
        IXLCell cell = ws.Cell(row, 1);
        cell.Value = title;
        cell.Style.Fill.BackgroundColor = SoftIndigoFill;
        cell.Style.Font.FontColor = BrandIndigoDeep;
        cell.Style.Font.Bold = true;
        cell.Style.Font.FontSize = 11;
        cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
        cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        cell.Style.Alignment.Indent = 1;
        cell.Style.Border.BottomBorder = XLBorderStyleValues.Medium;
        cell.Style.Border.BottomBorderColor = BrandIndigo;
        ws.Row(row).Height = 20;
    }

    private static void ApplyHeadersAtRow(IXLWorksheet ws, string[] headers, int row)
    {
        for (int col = 1; col <= headers.Length; col++)
        {
            IXLCell cell = ws.Cell(row, col);
            cell.Value = headers[col - 1];
            cell.Style.Fill.BackgroundColor = SoftIndigoFill;
            cell.Style.Font.FontColor = HeaderText;
            cell.Style.Font.Bold = true;
            cell.Style.Font.FontSize = 11;
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            cell.Style.Border.BottomBorder = XLBorderStyleValues.Medium;
            cell.Style.Border.BottomBorderColor = BrandIndigo;
        }
        ws.Row(row).Height = 22;
    }

    private static (XLColor bg, XLColor fg) GradeColor(string? grade) => grade switch
    {
        null => (GrayBg, GrayFg),
        "A" => (GreenBg, GreenFg),
        "B" => (GreenBg2, GreenFg2),
        "C" => (YellowBg, YellowFg),
        "D" => (OrangeBg, OrangeFg),
        "E" => (OrangeBg, XLColor.FromHtml("#9A3412")),
        _ => (RedBg, RedFg),
    };

    private static (XLColor bg, XLColor fg) ScoreColor(int score) => score switch
    {
        >= 90 => (GreenBg, GreenFg),
        >= 75 => (GreenBg2, GreenFg2),
        >= 60 => (YellowBg, YellowFg),
        >= 45 => (OrangeBg, OrangeFg),
        _ => (RedBg, RedFg),
    };

    private static (XLColor bg, XLColor fg) DepStatusColor(string status) => status switch
    {
        "UpToDate" => (GreenBg, GreenFg),
        "MinorUpdate" => (YellowBg, YellowFg),
        "MajorUpdate" => (OrangeBg, OrangeFg),
        "EOL" or "Vulnerable" => (RedBg, RedFg),
        _ => (GrayBg, GrayFg),
    };

    private static (XLColor bg, XLColor fg) SeverityColor(string severity) => severity switch
    {
        "Critical" => (RedBg, RedFg),
        "High" => (OrangeBg, OrangeFg),
        "Medium" => (YellowBg, YellowFg),
        _ => (GrayBg, GrayFg),
    };

    private static string SafeSheetName(string name)
    {
        string cleaned = System.Text.RegularExpressions.Regex.Replace(name, @"[/\\?\*\[\]:]", "_");
        return cleaned.Length > 28 ? cleaned[..28] : cleaned;
    }

    private static string TranslateDependencyStatus(string status, bool en) => status switch
    {
        "UpToDate" => en ? "Up to date" : "À jour",
        "MinorUpdate" => en ? "Minor update" : "Mise à jour mineure",
        "MajorUpdate" => en ? "Major update" : "Mise à jour majeure",
        "EOL" => en ? "Obsolete" : "Obsolète",
        "Vulnerable" => en ? "Vulnerable" : "Vulnérable",
        _ => status,
    };

    private static string TranslateSeverity(string severity, bool en) => severity switch
    {
        "Critical" => en ? "Critical" : "Critique",
        "High" => en ? "High" : "Élevé",
        "Medium" => en ? "Medium" : "Moyen",
        "Low" => en ? "Low" : "Faible",
        _ => severity,
    };

    private static string TranslateDependencyType(string type, bool en) => type switch
    {
        "Prod" => en ? "Production" : "Production",
        "Dev" => en ? "Development" : "Développement",
        _ => type,
    };

    private static void FinalizeSheet(IXLWorksheet ws, int colCount, int freezeRow, int filterHeaderRow, int filterLastRow, int repeatTop)
    {
        IXLRange? used = ws.RangeUsed();
        if (used != null) used.Style.Font.FontName = BaseFont;

        for (int col = 1; col <= colCount; col++)
        {
            ws.Column(col).AdjustToContents();
            if (ws.Column(col).Width < 12) ws.Column(col).Width = 12;
            if (ws.Column(col).Width > 60) ws.Column(col).Width = 60;
        }

        ws.ShowGridLines = false;

        if (freezeRow > 0)
            ws.SheetView.FreezeRows(freezeRow);

        if (filterHeaderRow > 0 && filterLastRow >= filterHeaderRow)
            ws.Range(filterHeaderRow, 1, filterLastRow, colCount).SetAutoFilter();

        IXLPageSetup ps = ws.PageSetup;
        ps.PageOrientation = XLPageOrientation.Landscape;
        ps.PaperSize = XLPaperSize.A4Paper;
        ps.PagesWide = 1;
        ps.PagesTall = 0;
        ps.Margins.Top = 0.6;
        ps.Margins.Bottom = 0.6;
        ps.Margins.Left = 0.5;
        ps.Margins.Right = 0.5;
        ps.CenterHorizontally = true;

        if (repeatTop > 0)
            ps.SetRowsToRepeatAtTop(1, repeatTop);

        ps.Footer.Left.AddText("Sentinel");
        ps.Footer.Right.AddText("Page ");
        ps.Footer.Right.AddText(XLHFPredefinedText.PageNumber);
        ps.Footer.Right.AddText(" / ");
        ps.Footer.Right.AddText(XLHFPredefinedText.NumberOfPages);
    }

    private static byte[] SaveWorkbook(XLWorkbook workbook)
    {
        using MemoryStream ms = new();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }

    private sealed class ExportLabels
    {
        public required bool IsEn { get; init; }
        public required string DateFormat { get; init; }

        public required string[] TicketHeaders { get; init; }
        public required string[] RecapHeaders { get; init; }
        public required string[] RuntimeHeaders { get; init; }
        public required string[] DepHeaders { get; init; }
        public required string[] VulnHeaders { get; init; }

        public required string TitleTickets { get; init; }
        public required string TitleTechHealth { get; init; }

        public required string SheetTickets { get; init; }
        public required string SheetRecap { get; init; }

        public required string SubjectTickets { get; init; }
        public required string SubjectTechHealth { get; init; }

        public required string SectionRuntimes { get; init; }
        public required string SectionDependencies { get; init; }
        public required string SectionVulnerabilities { get; init; }

        public required string GeneratedOn { get; init; }
        public required string AtWord { get; init; }
        public required string TotalWord { get; init; }
        public required string UnitTickets { get; init; }
        public required string UnitProjects { get; init; }

        public required string NoRuntimes { get; init; }
        public required string NoDependencies { get; init; }
        public required string NoVulnerabilities { get; init; }
        public required string StatusUnknown { get; init; }
        public required string GradeNotAvailable { get; init; }

        public required string RuntimeActive { get; init; }
        public required string RuntimeSoonEol { get; init; }
        public required string RuntimeEol { get; init; }

        public static ExportLabels For(bool en) => en
            ? new ExportLabels
            {
                IsEn = true,
                DateFormat = "mm/dd/yyyy",
                TicketHeaders = ["Reference", "Title", "Status", "Priority", "Type", "Assignee", "Project", "Created by", "Created on", "Updated on", "Est. hours"],
                RecapHeaders = ["Project", "Grade", "Score /100", "Dependencies", "To update", "Vulnerable", "Critical", "Obsolete runtimes", "Last scan"],
                RuntimeHeaders = ["Runtime", "Version", "Support ends", "Status"],
                DepHeaders = ["Name", "Current version", "Latest version", "Ecosystem", "Type", "Status", "Vulnerabilities"],
                VulnHeaders = ["CVE", "CVSS score", "Severity", "Dependency", "Fix", "Description"],
                TitleTickets = "Sentinel — Tickets",
                TitleTechHealth = "Sentinel — TechHealth",
                SheetTickets = "Tickets",
                SheetRecap = "Summary",
                SubjectTickets = "Tickets Export",
                SubjectTechHealth = "TechHealth Export",
                SectionRuntimes = "RUNTIMES",
                SectionDependencies = "DEPENDENCIES",
                SectionVulnerabilities = "VULNERABILITIES",
                GeneratedOn = "Generated on",
                AtWord = "at",
                TotalWord = "TOTAL",
                UnitTickets = "tickets",
                UnitProjects = "projects",
                NoRuntimes = "No runtime detected",
                NoDependencies = "No dependency detected",
                NoVulnerabilities = "No vulnerability detected",
                StatusUnknown = "Unknown",
                GradeNotAvailable = "N/A",
                RuntimeActive = "Active",
                RuntimeSoonEol = "Soon obsolete",
                RuntimeEol = "Obsolete",
            }
            : new ExportLabels
            {
                IsEn = false,
                DateFormat = "dd/mm/yyyy",
                TicketHeaders = ["Référence", "Titre", "Statut", "Priorité", "Type", "Assigné à", "Projet", "Créé par", "Créé le", "Mis à jour le", "H. estimées"],
                RecapHeaders = ["Projet", "Grade", "Score /100", "Dépendances", "À mettre à jour", "Vulnérables", "Critiques", "Runtimes obsolètes", "Dernier scan"],
                RuntimeHeaders = ["Runtime", "Version", "Fin de support", "Statut"],
                DepHeaders = ["Nom", "Version actuelle", "Dernière version", "Écosystème", "Type", "Statut", "Vulnérabilités"],
                VulnHeaders = ["CVE", "Score CVSS", "Sévérité", "Dépendance", "Correctif", "Description"],
                TitleTickets = "Sentinel — Tickets",
                TitleTechHealth = "Sentinel — TechHealth",
                SheetTickets = "Tickets",
                SheetRecap = "Récapitulatif",
                SubjectTickets = "Export Tickets",
                SubjectTechHealth = "Export TechHealth",
                SectionRuntimes = "RUNTIMES",
                SectionDependencies = "DÉPENDANCES",
                SectionVulnerabilities = "VULNÉRABILITÉS",
                GeneratedOn = "Généré le",
                AtWord = "à",
                TotalWord = "TOTAL",
                UnitTickets = "ticket(s)",
                UnitProjects = "projet(s)",
                NoRuntimes = "Aucun runtime détecté",
                NoDependencies = "Aucune dépendance détectée",
                NoVulnerabilities = "Aucune vulnérabilité détectée",
                StatusUnknown = "Inconnu",
                GradeNotAvailable = "N/A",
                RuntimeActive = "Actif",
                RuntimeSoonEol = "Bientôt obsolète",
                RuntimeEol = "Obsolète",
            };
    }
}
