using ClosedXML.Excel;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.TechHealth;
using static Sentinel.Application.Exports.Excel.ExcelFormatting;

namespace Sentinel.Application.Exports.Excel;

internal static class TechHealthWorkbookWriter
{
    public static byte[] Write(List<Project> projects, ExportLabels L, bool truncated)
    {
        using XLWorkbook workbook = new();
        ApplyDocumentProperties(workbook, L.SubjectTechHealth);
        WriteRecapSheet(workbook, projects, L, truncated);
        HashSet<string> usedNames = new(StringComparer.OrdinalIgnoreCase) { L.SheetRecap };
        foreach (Project project in projects.Where(HasInventory))
        {
            string sheetName = UniqueSheetName(SafeSheetName(project.Name), usedNames);
            WriteProjectSheet(workbook, project, sheetName, L);
        }
        return SaveWorkbook(workbook);
    }

    private static bool HasInventory(Project project) =>
        project.Dependencies.Count > 0 || project.Runtimes.Count > 0;

    private readonly record struct RecapCounts(int Dependencies, int ToUpdate, int VulnerableDependencies,
        int Criticals, int EolRuntimes)
    {
        public RecapCounts Add(RecapCounts other) => new(
            Dependencies + other.Dependencies,
            ToUpdate + other.ToUpdate,
            VulnerableDependencies + other.VulnerableDependencies,
            Criticals + other.Criticals,
            EolRuntimes + other.EolRuntimes);

        public static RecapCounts Of(Project project)
        {
            ProjectInventoryCounts counts = ProjectInventoryCounts.Of(project.Dependencies);

            return new RecapCounts(
                project.Dependencies.Count,
                counts.MinorUpdates + counts.MajorUpdates,
                project.Dependencies.Count(d => d.Vulnerabilities.Any()),
                counts.CriticalVulnerabilities,
                RuntimeGrouping.ByName(project.Runtimes).Count(FindingRules.IsEol));
        }
    }

    private static void WriteRecapSheet(XLWorkbook wb, List<Project> projects, ExportLabels L, bool truncated)
    {
        string[] headers = L.RecapHeaders;
        IXLWorksheet ws = wb.Worksheets.Add(L.SheetRecap);

        ApplyTitle(ws, L.TitleTechHealth, headers.Length);
        ApplyMetaRow(ws, headers.Length, BuildMeta(L, $"{projects.Count} {L.UnitProjects}",
            truncated ? $"{L.ExportTruncated} {ExportLimits.MaxProjectSheets}" : null));
        ApplyHeadersAtRow(ws, headers, HeaderRow);

        RecapCounts totals = default;

        for (int i = 0; i < projects.Count; i++)
        {
            int row = i + FirstDataRow;
            SetRowBackground(ws, row, headers.Length, StripeColor(i));
            totals = totals.Add(WriteProjectRow(ws, row, projects[i], L));
        }

        int lastDataRow = projects.Count > 0 ? projects.Count + FirstDataRow - 1 : HeaderRow;
        ApplyDataBlockStyle(ws, FirstDataRow, lastDataRow, headers.Length);

        if (projects.Count > 0)
            WriteTotals(ws, lastDataRow + 1, headers.Length, projects.Count, totals, L);

        FinalizeSheet(ws, headers.Length, HeaderRow, HeaderRow, lastDataRow, HeaderRow);
    }

    private static RecapCounts WriteProjectRow(IXLWorksheet ws, int row, Project project, ExportLabels L)
    {
        ws.Cell(row, 1).Value = project.Name;
        ApplyStatusCell(ws.Cell(row, 2), project.HealthGrade ?? L.GradeNotAvailable, GradeColor(project.HealthGrade));
        SetScoreCell(ws.Cell(row, 3), project.HealthScore, L);

        RecapCounts counts = RecapCounts.Of(project);
        SetCountCell(ws.Cell(row, 4), counts.Dependencies);
        SetCountCell(ws.Cell(row, 5), counts.ToUpdate, OrangeFg);
        SetCountCell(ws.Cell(row, 6), counts.VulnerableDependencies, OrangeFg);
        SetCountCell(ws.Cell(row, 7), counts.Criticals, RedFg);
        SetCountCell(ws.Cell(row, 8), counts.EolRuntimes, RedFg);

        if (project.LastScanAt.HasValue)
            SetDateCell(ws.Cell(row, 9), project.LastScanAt.Value, L.DateFormat);
        else
            SetPlaceholderCell(ws.Cell(row, 9));

        return counts;
    }

    private static void SetScoreCell(IXLCell cell, int? healthScore, ExportLabels L)
    {
        cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        if (healthScore is not { } score)
        {
            cell.Value = L.GradeNotAvailable;
            cell.Style.Font.FontColor = GrayFg;
            return;
        }

        cell.Value = score;
        cell.Style.NumberFormat.Format = "0";
        cell.Style.Font.FontColor = ScoreColor(score);
        cell.Style.Font.Bold = true;
    }

    private static void WriteTotals(IXLWorksheet ws, int totalsRow, int colCount, int projectCount,
        RecapCounts totals, ExportLabels L)
    {
        ApplyTotalsRow(ws, totalsRow, colCount);
        ws.Range(totalsRow, 1, totalsRow, 3).Merge();
        ws.Cell(totalsRow, 1).Value = $"{L.TotalWord} — {projectCount} {L.UnitProjects}";
        ws.Cell(totalsRow, 4).Value = totals.Dependencies;
        ws.Cell(totalsRow, 5).Value = totals.ToUpdate;
        ws.Cell(totalsRow, 6).Value = totals.VulnerableDependencies;
        ws.Cell(totalsRow, 7).Value = totals.Criticals;
        ws.Cell(totalsRow, 8).Value = totals.EolRuntimes;
        ws.Cell(totalsRow, 9).Value = "—";
    }

    private static void WriteProjectSheet(XLWorkbook wb, Project project, string sheetName, ExportLabels L)
    {
        IXLWorksheet ws = wb.Worksheets.Add(sheetName);

        int nextRow = WriteRuntimeSection(ws, project, L, 1);
        nextRow = WriteDependencySection(ws, project, L, nextRow + 1);
        WriteVulnerabilitySection(ws, project, L, nextRow + 1);

        int widestSection = Math.Max(L.RuntimeHeaders.Length, Math.Max(L.DepHeaders.Length, L.VulnHeaders.Length));
        FinalizeSheet(ws, widestSection, 0, 0, 0, 0);
    }

    private static int WriteSectionHeading(IXLWorksheet ws, int row, string title, string[] headers)
    {
        ApplySectionTitle(ws, row, headers.Length, title);
        ApplyHeadersAtRow(ws, headers, row + 1);
        return row + 2;
    }

    private static int WriteRuntimeSection(IXLWorksheet ws, Project project, ExportLabels L, int startRow)
    {
        string[] headers = L.RuntimeHeaders;
        int firstRow = WriteSectionHeading(ws, startRow, L.SectionRuntimes, headers);
        List<Runtime> runtimes = project.Runtimes.OrderBy(r => r.Name).ToList();

        for (int i = 0; i < runtimes.Count; i++)
        {
            int row = firstRow + i;
            SetRowBackground(ws, row, headers.Length, StripeColor(i));
            WriteRuntimeRow(ws, row, runtimes[i], L);
        }

        return CloseDataBlock(ws, firstRow, runtimes.Count, headers.Length, L.NoRuntimes);
    }

    private static void WriteRuntimeRow(IXLWorksheet ws, int row, Runtime runtime, ExportLabels L)
    {
        ws.Cell(row, 1).Value = runtime.Name;
        ws.Cell(row, 2).Value = runtime.Version;

        if (runtime.EolDate.HasValue)
            SetDateCell(ws.Cell(row, 3), runtime.EolDate.Value, L.DateFormat);
        else
            SetPlaceholderCell(ws.Cell(row, 3));

        (string statusLabel, XLColor statusColor) = RuntimeStatus(runtime, L);
        ApplyStatusCell(ws.Cell(row, 4), statusLabel, statusColor);
    }

    private static (string label, XLColor fg) RuntimeStatus(Runtime r, ExportLabels L) =>
        RuntimeEolAssessment.Of(r, DateTime.UtcNow).Status switch
        {
            RuntimeEolStatus.Eol => (L.RuntimeEol, RedFg),
            RuntimeEolStatus.Danger => (L.RuntimeImminentEol, OrangeFg),
            RuntimeEolStatus.Warn => (L.RuntimeSoonEol, BrandIndigoDeep),
            RuntimeEolStatus.Ok => (L.RuntimeActive, GreenFg),
            _ => (L.RuntimeUnknown, GrayFg),
        };

    private static int WriteDependencySection(IXLWorksheet ws, Project project, ExportLabels L, int startRow)
    {
        string[] headers = L.DepHeaders;
        int firstRow = WriteSectionHeading(ws, startRow, L.SectionDependencies, headers);
        List<Dependency> dependencies = project.Dependencies
            .OrderBy(d => d.Status == DependencyStatus.UpToDate ? 1 : 0)
            .ThenBy(d => d.Name)
            .ToList();

        for (int i = 0; i < dependencies.Count; i++)
        {
            int row = firstRow + i;
            SetRowBackground(ws, row, headers.Length, StripeColor(i));
            WriteDependencyRow(ws, row, dependencies[i], L);
        }

        return CloseDataBlock(ws, firstRow, dependencies.Count, headers.Length, L.NoDependencies);
    }

    private static void WriteDependencyRow(IXLWorksheet ws, int row, Dependency dependency, ExportLabels L)
    {
        ws.Cell(row, 1).Value = dependency.Name;
        ws.Cell(row, 2).Value = dependency.CurrentVersion;

        if (!string.IsNullOrEmpty(dependency.LatestVersion))
            ws.Cell(row, 3).Value = dependency.LatestVersion;
        else
            SetPlaceholderCell(ws.Cell(row, 3));

        ws.Cell(row, 4).Value = dependency.Ecosystem.ToString();
        ws.Cell(row, 5).Value = L.Translate(dependency.Type);

        ApplyStatusCell(ws.Cell(row, 6), L.Translate(dependency.Status),
            DependencyStatusColor(dependency.Status));

        SetCountCell(ws.Cell(row, 7), dependency.Vulnerabilities.Count, RedFg);
    }

    private static int CloseDataBlock(IXLWorksheet ws, int firstRow, int rowCount, int colCount, string emptyText)
    {
        int nextRow = firstRow + rowCount;
        ApplyDataBlockStyle(ws, firstRow, nextRow - 1, colCount);

        if (rowCount > 0) return nextRow;

        ApplyEmptyRow(ws, nextRow, colCount, emptyText);
        return nextRow + 1;
    }

    private static void WriteVulnerabilitySection(IXLWorksheet ws, Project project, ExportLabels L, int startRow)
    {
        string[] headers = L.VulnHeaders;
        int firstRow = WriteSectionHeading(ws, startRow, L.SectionVulnerabilities, headers);

        List<(Dependency Dependency, Vulnerability Vulnerability)> findings = project.Dependencies
            .SelectMany(d => d.Vulnerabilities.Select(v => (Dependency: d, Vulnerability: v)))
            .OrderByDescending(finding => finding.Vulnerability.CvssScore)
            .ToList();

        if (findings.Count == 0)
        {
            WriteNoVulnerabilityRow(ws, firstRow, headers.Length, L);
            return;
        }

        for (int i = 0; i < findings.Count; i++)
        {
            int row = firstRow + i;
            SetRowBackground(ws, row, headers.Length, StripeColor(i), autoHeight: true);
            WriteVulnerabilityRow(ws, row, findings[i].Dependency, findings[i].Vulnerability, L);
        }

        ApplyDataBlockStyle(ws, firstRow, firstRow + findings.Count - 1, headers.Length, autoHeight: true);
    }

    private static void WriteNoVulnerabilityRow(IXLWorksheet ws, int row, int colCount, ExportLabels L)
    {
        IXLCell cell = ws.Cell(row, 1);
        cell.Value = L.NoVulnerabilities;
        ws.Range(row, 1, row, colCount).Merge();
        cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        cell.Style.Font.FontColor = GreenFg;
        cell.Style.Font.Bold = true;
        ws.Row(row).Height = 18;
    }

    private static void WriteVulnerabilityRow(IXLWorksheet ws, int row, Dependency dependency,
        Vulnerability vulnerability, ExportLabels L)
    {
        ws.Cell(row, 1).Value = VulnerabilityIdentity.Of(vulnerability);
        ws.Cell(row, 1).Style.Font.FontColor = LinkColor;

        XLColor severityColor = SeverityColor(vulnerability.Severity);
        IXLCell cvssCell = ws.Cell(row, 2);
        cvssCell.Value = (double)vulnerability.CvssScore;
        cvssCell.Style.NumberFormat.Format = "0.0";
        cvssCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        cvssCell.Style.Font.FontColor = severityColor;
        cvssCell.Style.Font.Bold = true;

        ApplyStatusCell(ws.Cell(row, 3), L.Translate(vulnerability.Severity), severityColor);

        ws.Cell(row, 4).Value = dependency.Name;

        if (!string.IsNullOrEmpty(vulnerability.FixedVersion))
            ws.Cell(row, 5).Value = vulnerability.FixedVersion;
        else
            SetPlaceholderCell(ws.Cell(row, 5));

        ws.Cell(row, 6).Value = vulnerability.Description;
        ws.Cell(row, 6).Style.Alignment.WrapText = true;
    }
}
