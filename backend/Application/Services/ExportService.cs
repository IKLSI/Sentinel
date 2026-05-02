using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Models;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Application.Services;

public class ExportService
{
    private readonly SentinelContext _context;

    private static readonly XLColor NavyBlue = XLColor.FromHtml("#1B3A6B");
    private static readonly XLColor HeaderBlue = XLColor.FromHtml("#2E6DA4");
    private static readonly XLColor AltRowColor = XLColor.FromHtml("#EBF3FB");
    private static readonly XLColor BorderColor = XLColor.FromHtml("#CCCCCC");
    private static readonly XLColor GreenBg = XLColor.FromHtml("#D5F5E3");
    private static readonly XLColor GreenFg = XLColor.FromHtml("#1E8449");
    private static readonly XLColor GrayBg = XLColor.FromHtml("#F2F3F4");
    private static readonly XLColor GrayFg = XLColor.FromHtml("#5D6D7E");
    private static readonly XLColor OrangeBg = XLColor.FromHtml("#FEF9E7");
    private static readonly XLColor OrangeFg = XLColor.FromHtml("#D68910");
    private static readonly XLColor YellowBg = XLColor.FromHtml("#FFF8E1");
    private static readonly XLColor YellowFg = XLColor.FromHtml("#F57F17");
    private static readonly XLColor RedBg = XLColor.FromHtml("#FDEDEC");
    private static readonly XLColor RedFg = XLColor.FromHtml("#C0392B");

    public ExportService(SentinelContext context)
    {
        _context = context;
    }

    public async Task<byte[]> ExportTimeEntriesExcelAsync(Guid organizationId, Guid? userId, DateOnly? from, DateOnly? to)
    {
        IQueryable<TimeEntry> query = _context.TimeEntries
            .Include(te => te.User)
            .Include(te => te.Ticket)
            .Include(te => te.TechProject)
            .Where(te => te.User.OrganizationId == organizationId);

        if (userId.HasValue)
            query = query.Where(te => te.UserId == userId.Value);

        if (from.HasValue)
            query = query.Where(te => te.Date >= from.Value);

        if (to.HasValue)
            query = query.Where(te => te.Date <= to.Value);

        List<TimeEntry> entries = await query.OrderByDescending(te => te.Date).ToListAsync();
        return WriteTimeEntriesExcel(entries);
    }

    public async Task<byte[]> ExportTicketsExcelAsync(
        Guid organizationId, string? status, string? priority, Guid? assignedTo, string? type, string? search)
    {
        IQueryable<Ticket> query = _context.Tickets
            .Include(t => t.TicketStatus)
            .Include(t => t.Project)
            .Include(t => t.AssignedTo)
            .Include(t => t.CreatedBy)
            .Include(t => t.TimeEntries)
            .Where(t => t.OrganizationId == organizationId);

        if (!string.IsNullOrEmpty(priority) && Enum.TryParse<TicketPriority>(priority, true, out TicketPriority parsedPriority))
            query = query.Where(t => t.Priority == parsedPriority);

        if (!string.IsNullOrEmpty(status) && Guid.TryParse(status, out Guid statusGuid))
            query = query.Where(t => t.TicketStatusId == statusGuid);

        if (assignedTo.HasValue)
            query = query.Where(t => t.AssignedToId == assignedTo.Value);

        if (!string.IsNullOrEmpty(type) && Enum.TryParse<TicketType>(type, true, out TicketType parsedType))
            query = query.Where(t => t.Type == parsedType);

        if (!string.IsNullOrWhiteSpace(search) && search.Length <= 100)
        {
            string escaped = search
                .Replace("\\", "\\\\")
                .Replace("%", "\\%")
                .Replace("_", "\\_");
            string pattern = $"%{escaped}%";
            query = query.Where(t =>
                EF.Functions.ILike(t.Title, pattern) ||
                EF.Functions.ILike(t.Description, pattern));
        }

        List<Ticket> tickets = await query.OrderByDescending(t => t.CreatedAt).ToListAsync();
        return WriteTicketsExcel(tickets);
    }

    private static byte[] WriteTimeEntriesExcel(List<TimeEntry> entries)
    {
        string[] headers = ["Date", "Utilisateur", "Projet", "Ticket", "Durée", "Commentaire"];

        using XLWorkbook workbook = new();
        IXLWorksheet ws = workbook.Worksheets.Add("Saisies de temps");

        ApplyTitle(ws, $"SENTINEL — Export Saisies de temps — {DateTime.Now:dd/MM/yyyy}", headers.Length);
        ApplyHeaders(ws, headers);

        for (int i = 0; i < entries.Count; i++)
        {
            TimeEntry te = entries[i];
            int row = i + 3;

            SetRowBackground(ws, row, headers.Length, i % 2 == 1 ? AltRowColor : XLColor.White);

            SetDateCell(ws.Cell(row, 1), te.Date.ToDateTime(TimeOnly.MinValue));
            ws.Cell(row, 2).Value = te.User?.FullName ?? string.Empty;
            ws.Cell(row, 3).Value = te.TechProject?.Name ?? string.Empty;
            ws.Cell(row, 4).Value = te.Ticket?.Title ?? string.Empty;

            ws.Cell(row, 5).Value = (double)Math.Round(te.DurationMinutes / 60m, 2);
            ws.Cell(row, 5).Style.NumberFormat.Format = "0.00 \"h\"";

            ws.Cell(row, 6).Value = te.Comment ?? string.Empty;
        }

        FinalizeSheet(ws, headers.Length);
        return SaveWorkbook(workbook);
    }

    private static byte[] WriteTicketsExcel(List<Ticket> tickets)
    {
        string[] headers = ["Référence", "Titre", "Statut", "Priorité", "Type", "Assigné à", "Projet", "Créé par", "Créé le", "Mis à jour le", "H. estimées", "H. saisies"];

        using XLWorkbook workbook = new();
        IXLWorksheet ws = workbook.Worksheets.Add("Tickets");

        ApplyTitle(ws, $"SENTINEL — Export Tickets — {DateTime.Now:dd/MM/yyyy}", headers.Length);
        ApplyHeaders(ws, headers);

        for (int i = 0; i < tickets.Count; i++)
        {
            Ticket t = tickets[i];
            int row = i + 3;

            SetRowBackground(ws, row, headers.Length, i % 2 == 1 ? AltRowColor : XLColor.White);

            ws.Cell(row, 1).Value = $"TKT-{t.Id.ToString().Replace("-", "")[..6].ToUpper()}";
            ws.Cell(row, 2).Value = t.Title;

            ApplyStatusCell(ws.Cell(row, 3), t.TicketStatus?.Name ?? "Inconnu", TicketStatusColor);
            ApplyStatusCell(ws.Cell(row, 4), TranslateTicketPriority(t.Priority.ToString()), TicketPriorityColor);

            ws.Cell(row, 5).Value = TranslateTicketType(t.Type.ToString());
            ws.Cell(row, 6).Value = t.AssignedTo?.FullName ?? string.Empty;
            ws.Cell(row, 7).Value = t.Project?.Name ?? string.Empty;
            ws.Cell(row, 8).Value = t.CreatedBy?.FullName ?? string.Empty;

            SetDateCell(ws.Cell(row, 9), t.CreatedAt);
            SetDateCell(ws.Cell(row, 10), t.UpdatedAt);

            if (t.EstimatedHours.HasValue)
            {
                ws.Cell(row, 11).Value = (double)t.EstimatedHours.Value;
                ws.Cell(row, 11).Style.NumberFormat.Format = "0.00 \"h\"";
            }

            ws.Cell(row, 12).Value = (double)Math.Round(t.TimeEntries.Sum(te => te.DurationMinutes) / 60m, 2);
            ws.Cell(row, 12).Style.NumberFormat.Format = "0.00 \"h\"";
        }

        FinalizeSheet(ws, headers.Length);
        return SaveWorkbook(workbook);
    }

    private static void ApplyTitle(IXLWorksheet ws, string title, int colCount)
    {
        ws.Range(1, 1, 1, colCount).Merge();
        IXLCell cell = ws.Cell(1, 1);
        cell.Value = title;
        cell.Style.Fill.BackgroundColor = NavyBlue;
        cell.Style.Font.FontColor = XLColor.White;
        cell.Style.Font.Bold = true;
        cell.Style.Font.FontSize = 13;
        cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        ws.Row(1).Height = 26;
    }

    private static void ApplyHeaders(IXLWorksheet ws, string[] headers)
    {
        for (int col = 1; col <= headers.Length; col++)
        {
            IXLCell cell = ws.Cell(2, col);
            cell.Value = headers[col - 1];
            cell.Style.Fill.BackgroundColor = HeaderBlue;
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Font.Bold = true;
            cell.Style.Font.FontSize = 11;
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            cell.Style.Border.BottomBorder = XLBorderStyleValues.Medium;
            cell.Style.Border.BottomBorderColor = XLColor.FromHtml("#1565A0");
        }
        ws.Row(2).Height = 22;
    }

    private static void SetRowBackground(IXLWorksheet ws, int row, int colCount, XLColor color)
    {
        IXLRange range = ws.Range(row, 1, row, colCount);
        range.Style.Fill.BackgroundColor = color;
        range.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        range.Style.Border.OutsideBorderColor = BorderColor;
        range.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
        range.Style.Border.InsideBorderColor = BorderColor;
        range.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        ws.Row(row).Height = 18;
    }

    private static void SetDateCell(IXLCell cell, DateTime dt)
    {
        cell.Value = dt;
        cell.Style.NumberFormat.Format = "dd/mm/yyyy";
    }

    private static void ApplyStatusCell(IXLCell cell, string value, Func<string, (XLColor bg, XLColor fg)> colorFn)
    {
        cell.Value = value;
        (XLColor bg, XLColor fg) = colorFn(value);
        cell.Style.Fill.BackgroundColor = bg;
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
        "Critique" => (RedBg, RedFg),
        "Élevé" => (OrangeBg, OrangeFg),
        "Moyen" => (YellowBg, YellowFg),
        _ => (GrayBg, GrayFg),
    };

    private static string TranslateTicketPriority(string priority) => priority switch
    {
        "Low" => "Faible",
        "Medium" => "Moyen",
        "High" => "Élevé",
        "Critical" => "Critique",
        _ => priority,
    };

    private static string TranslateTicketType(string type) => type switch
    {
        "Feature" => "Fonctionnalité",
        "Security" => "Sécurité",
        _ => type,
    };

    public async Task<byte[]> ExportTechHealthExcelAsync(Guid organizationId)
    {
        List<TechProject> projects = await _context.TechProjects
            .Include(p => p.Dependencies).ThenInclude(d => d.Vulnerabilities)
            .Include(p => p.Runtimes)
            .Where(p => p.OrganizationId == organizationId)
            .OrderBy(p => p.Name)
            .ToListAsync();

        return WriteTechHealthExcel(projects);
    }

    private static byte[] WriteTechHealthExcel(List<TechProject> projects)
    {
        using XLWorkbook workbook = new();
        WriteRecapSheet(workbook, projects);
        Dictionary<string, int> usedNames = [];
        foreach (TechProject project in projects)
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
            WriteProjectSheet(workbook, project, baseName);
        }
        return SaveWorkbook(workbook);
    }

    private static void WriteRecapSheet(XLWorkbook wb, List<TechProject> projects)
    {
        string[] headers = ["Projet", "Grade", "Score /100", "Dépendances", "À mettre à jour", "Vulnérables", "Critiques", "Runtimes EOL", "Dernier scan"];
        IXLWorksheet ws = wb.Worksheets.Add("Récapitulatif");

        ApplyTitle(ws, $"SENTINEL — TechHealth — {DateTime.Now:dd/MM/yyyy}", headers.Length);
        ApplyHeaders(ws, headers);

        for (int i = 0; i < projects.Count; i++)
        {
            TechProject p = projects[i];
            int row = i + 3;
            SetRowBackground(ws, row, headers.Length, i % 2 == 1 ? AltRowColor : XLColor.White);

            ws.Cell(row, 1).Value = p.Name;

            ApplyStatusCell(ws.Cell(row, 2), p.HealthGrade, s => GradeColor(s));

            IXLCell scoreCell = ws.Cell(row, 3);
            scoreCell.Value = p.HealthScore;
            scoreCell.Style.NumberFormat.Format = "0";
            scoreCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            (XLColor scoreBg, XLColor scoreFg) = ScoreColor(p.HealthScore);
            scoreCell.Style.Fill.BackgroundColor = scoreBg;
            scoreCell.Style.Font.FontColor = scoreFg;
            scoreCell.Style.Font.Bold = true;

            int toUpdate = p.Dependencies.Count(d => d.Status == DependencyStatus.MinorUpdate || d.Status == DependencyStatus.MajorUpdate);
            int vulnerableDeps = p.Dependencies.Count(d => d.Vulnerabilities.Any());
            int criticals = p.Dependencies.SelectMany(d => d.Vulnerabilities).Count(v => v.Severity == VulnerabilitySeverity.Critical);
            int eolRuntimes = p.Runtimes.Count(r => r.IsEol);

            ws.Cell(row, 4).Value = p.Dependencies.Count;
            ws.Cell(row, 4).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            IXLCell updateCell = ws.Cell(row, 5);
            updateCell.Value = toUpdate;
            updateCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            if (toUpdate > 0) { updateCell.Style.Fill.BackgroundColor = OrangeBg; updateCell.Style.Font.FontColor = OrangeFg; updateCell.Style.Font.Bold = true; }

            IXLCell vulnCell = ws.Cell(row, 6);
            vulnCell.Value = vulnerableDeps;
            vulnCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            if (vulnerableDeps > 0) { vulnCell.Style.Fill.BackgroundColor = OrangeBg; vulnCell.Style.Font.FontColor = OrangeFg; vulnCell.Style.Font.Bold = true; }

            IXLCell critCell = ws.Cell(row, 7);
            critCell.Value = criticals;
            critCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            if (criticals > 0) { critCell.Style.Fill.BackgroundColor = RedBg; critCell.Style.Font.FontColor = RedFg; critCell.Style.Font.Bold = true; }

            IXLCell eolCell = ws.Cell(row, 8);
            eolCell.Value = eolRuntimes;
            eolCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            if (eolRuntimes > 0) { eolCell.Style.Fill.BackgroundColor = RedBg; eolCell.Style.Font.FontColor = RedFg; eolCell.Style.Font.Bold = true; }

            if (p.LastScanAt.HasValue)
                SetDateCell(ws.Cell(row, 9), p.LastScanAt.Value);
            else
            {
                ws.Cell(row, 9).Value = "—";
                ws.Cell(row, 9).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                ws.Cell(row, 9).Style.Font.FontColor = GrayFg;
            }
        }

        FinalizeSheet(ws, headers.Length);
    }

    private static void WriteProjectSheet(XLWorkbook wb, TechProject project, string sheetName)
    {
        IXLWorksheet ws = wb.Worksheets.Add(sheetName);

        int currentRow = 1;

        string[] runtimeHeaders = ["Runtime", "Version", "Date EOL", "Statut"];
        ApplySectionTitle(ws, currentRow, runtimeHeaders.Length, "RUNTIMES");
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
                SetDateCell(ws.Cell(currentRow, 3), r.EolDate.Value);
            else
            {
                ws.Cell(currentRow, 3).Value = "—";
                ws.Cell(currentRow, 3).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                ws.Cell(currentRow, 3).Style.Font.FontColor = GrayFg;
            }

            string runtimeStatus = r.IsEol ? "EOL" :
                (r.EolDate.HasValue && r.EolDate.Value < DateTime.Now.AddMonths(6) ? "Bientôt EOL" : "Actif");
            (XLColor rBg, XLColor rFg) = runtimeStatus switch
            {
                "EOL" => (RedBg, RedFg),
                "Bientôt EOL" => (OrangeBg, OrangeFg),
                _ => (GreenBg, GreenFg),
            };
            IXLCell statusCell = ws.Cell(currentRow, 4);
            statusCell.Value = runtimeStatus;
            statusCell.Style.Fill.BackgroundColor = rBg;
            statusCell.Style.Font.FontColor = rFg;
            statusCell.Style.Font.Bold = true;
            statusCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            currentRow++;
        }

        if (runtimes.Count == 0)
        {
            IXLCell emptyCell = ws.Cell(currentRow, 1);
            emptyCell.Value = "Aucun runtime détecté";
            ws.Range(currentRow, 1, currentRow, runtimeHeaders.Length).Merge();
            emptyCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            emptyCell.Style.Font.FontColor = GrayFg;
            emptyCell.Style.Font.Italic = true;
            ws.Row(currentRow).Height = 18;
            currentRow++;
        }

        currentRow++;

        string[] depHeaders = ["Nom", "Version actuelle", "Dernière version", "Écosystème", "Type", "Statut", "Vulnérabilités"];
        ApplySectionTitle(ws, currentRow, depHeaders.Length, "DÉPENDANCES");
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
            ws.Cell(currentRow, 5).Value = TranslateDependencyType(d.Type.ToString());

            ApplyStatusCell(ws.Cell(currentRow, 6), TranslateDependencyStatus(d.Status.ToString()), s => DepStatusColor(s));

            int vulnCount = d.Vulnerabilities.Count;
            IXLCell vulnCountCell = ws.Cell(currentRow, 7);
            vulnCountCell.Value = vulnCount;
            vulnCountCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            if (vulnCount > 0) { vulnCountCell.Style.Fill.BackgroundColor = RedBg; vulnCountCell.Style.Font.FontColor = RedFg; vulnCountCell.Style.Font.Bold = true; }

            currentRow++;
        }

        if (deps.Count == 0)
        {
            IXLCell emptyCell = ws.Cell(currentRow, 1);
            emptyCell.Value = "Aucune dépendance détectée";
            ws.Range(currentRow, 1, currentRow, depHeaders.Length).Merge();
            emptyCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            emptyCell.Style.Font.FontColor = GrayFg;
            emptyCell.Style.Font.Italic = true;
            ws.Row(currentRow).Height = 18;
            currentRow++;
        }

        currentRow++;

        string[] vulnHeaders = ["CVE", "Score CVSS", "Sévérité", "Dépendance", "Correctif", "Description"];
        ApplySectionTitle(ws, currentRow, vulnHeaders.Length, "VULNÉRABILITÉS");
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
            noVulnCell.Value = "Aucune vulnérabilité détectée";
            ws.Range(currentRow, 1, currentRow, vulnHeaders.Length).Merge();
            noVulnCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            noVulnCell.Style.Fill.BackgroundColor = GreenBg;
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
                SetRowBackground(ws, currentRow, vulnHeaders.Length, i % 2 == 1 ? AltRowColor : XLColor.White);

                ws.Cell(currentRow, 1).Value = v.CveId;
                ws.Cell(currentRow, 1).Style.Font.FontColor = XLColor.FromHtml("#1565A0");

                IXLCell cvssCell = ws.Cell(currentRow, 2);
                cvssCell.Value = (double)v.CvssScore;
                cvssCell.Style.NumberFormat.Format = "0.0";
                cvssCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                (XLColor cvssB, XLColor cvssF) = SeverityColor(v.Severity.ToString());
                cvssCell.Style.Fill.BackgroundColor = cvssB;
                cvssCell.Style.Font.FontColor = cvssF;
                cvssCell.Style.Font.Bold = true;

                ApplyStatusCell(ws.Cell(currentRow, 3), TranslateSeverity(v.Severity.ToString()), s => SeverityColor(s));

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

        FinalizeSheet(ws, Math.Max(runtimeHeaders.Length, Math.Max(depHeaders.Length, vulnHeaders.Length)));
    }

    private static void ApplySectionTitle(IXLWorksheet ws, int row, int colCount, string title)
    {
        ws.Range(row, 1, row, colCount).Merge();
        IXLCell cell = ws.Cell(row, 1);
        cell.Value = title;
        cell.Style.Fill.BackgroundColor = NavyBlue;
        cell.Style.Font.FontColor = XLColor.White;
        cell.Style.Font.Bold = true;
        cell.Style.Font.FontSize = 11;
        cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
        cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        ws.Row(row).Height = 20;
    }

    private static void ApplyHeadersAtRow(IXLWorksheet ws, string[] headers, int row)
    {
        for (int col = 1; col <= headers.Length; col++)
        {
            IXLCell cell = ws.Cell(row, col);
            cell.Value = headers[col - 1];
            cell.Style.Fill.BackgroundColor = HeaderBlue;
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Font.Bold = true;
            cell.Style.Font.FontSize = 11;
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            cell.Style.Border.BottomBorder = XLBorderStyleValues.Medium;
            cell.Style.Border.BottomBorderColor = XLColor.FromHtml("#1565A0");
        }
        ws.Row(row).Height = 22;
    }

    private static (XLColor bg, XLColor fg) GradeColor(string grade) => grade switch
    {
        "A" => (XLColor.FromHtml("#D5F5E3"), XLColor.FromHtml("#1E8449")),
        "B" => (XLColor.FromHtml("#EAFAF1"), XLColor.FromHtml("#27AE60")),
        "C" => (YellowBg, YellowFg),
        "D" => (OrangeBg, OrangeFg),
        "E" => (XLColor.FromHtml("#FDEBD0"), XLColor.FromHtml("#CA6F1E")),
        _ => (RedBg, RedFg),
    };

    private static (XLColor bg, XLColor fg) ScoreColor(int score) => score switch
    {
        >= 90 => (XLColor.FromHtml("#D5F5E3"), XLColor.FromHtml("#1E8449")),
        >= 75 => (XLColor.FromHtml("#EAFAF1"), XLColor.FromHtml("#27AE60")),
        >= 60 => (YellowBg, YellowFg),
        >= 45 => (OrangeBg, OrangeFg),
        _ => (RedBg, RedFg),
    };

    private static (XLColor bg, XLColor fg) DepStatusColor(string status) => status switch
    {
        "À jour" => (GreenBg, GreenFg),
        "Mise à jour mineure" => (YellowBg, YellowFg),
        "Mise à jour majeure" => (OrangeBg, OrangeFg),
        "EOL" or "Vulnérable" => (RedBg, RedFg),
        _ => (GrayBg, GrayFg),
    };

    private static (XLColor bg, XLColor fg) SeverityColor(string severity) => severity switch
    {
        "Critical" or "Critique" => (RedBg, RedFg),
        "High" or "Élevé" => (OrangeBg, OrangeFg),
        "Medium" or "Moyen" => (YellowBg, YellowFg),
        _ => (GrayBg, GrayFg),
    };

    private static string SafeSheetName(string name)
    {
        string cleaned = System.Text.RegularExpressions.Regex.Replace(name, @"[/\\?\*\[\]:]", "_");
        return cleaned.Length > 28 ? cleaned[..28] : cleaned;
    }

    private static string TranslateDependencyStatus(string status) => status switch
    {
        "UpToDate" => "À jour",
        "MinorUpdate" => "Mise à jour mineure",
        "MajorUpdate" => "Mise à jour majeure",
        "EOL" => "EOL",
        "Vulnerable" => "Vulnérable",
        _ => status,
    };

    private static string TranslateSeverity(string severity) => severity switch
    {
        "Critical" => "Critique",
        "High" => "Élevé",
        "Medium" => "Moyen",
        "Low" => "Faible",
        _ => severity,
    };

    private static string TranslateDependencyType(string type) => type switch
    {
        "Prod" => "Production",
        "Dev" => "Développement",
        _ => type,
    };

    private static void FinalizeSheet(IXLWorksheet ws, int colCount)
    {
        ws.SheetView.FreezeRows(2);
        for (int col = 1; col <= colCount; col++)
        {
            ws.Column(col).AdjustToContents();
            if (ws.Column(col).Width < 12) ws.Column(col).Width = 12;
            if (ws.Column(col).Width > 60) ws.Column(col).Width = 60;
        }
    }

    private static byte[] SaveWorkbook(XLWorkbook workbook)
    {
        using MemoryStream ms = new();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }
}
