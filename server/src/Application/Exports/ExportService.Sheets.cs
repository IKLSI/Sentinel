using ClosedXML.Excel;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.Exports;
public partial class ExportService
{
    private void WriteRecapSheet(XLWorkbook wb, List<Project> projects, ExportLabels L, bool truncated)
    {
        string[] headers = L.RecapHeaders;
        IXLWorksheet ws = wb.Worksheets.Add(L.SheetRecap);

        ApplyTitle(ws, L.TitleTechHealth, headers.Length);
        ApplyMetaRow(ws, headers.Length, BuildMeta(L, $"{projects.Count} {L.UnitProjects}",
            truncated ? $"{L.ExportTruncated} {ExportLimits.MaxProjectSheets}" : null));
        ApplyHeadersAtRow(ws, headers, HeaderRow);

        int sumDeps = 0, sumUpdate = 0, sumVuln = 0, sumCrit = 0, sumEol = 0;

        for (int i = 0; i < projects.Count; i++)
        {
            Project p = projects[i];
            int row = i + FirstDataRow;
            SetRowBackground(ws, row, headers.Length, i % 2 == 1 ? AltRowColor : XLColor.White);

            ws.Cell(row, 1).Value = p.Name;

            ApplyStatusCell(ws.Cell(row, 2), p.HealthGrade ?? L.GradeNotAvailable, GradeColor(p.HealthGrade));

            IXLCell scoreCell = ws.Cell(row, 3);
            scoreCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            if (p.HealthScore is { } score)
            {
                scoreCell.Value = score;
                scoreCell.Style.NumberFormat.Format = "0";
                scoreCell.Style.Font.FontColor = ScoreColor(score);
                scoreCell.Style.Font.Bold = true;
            }
            else
            {
                scoreCell.Value = L.GradeNotAvailable;
                scoreCell.Style.Font.FontColor = GrayFg;
            }

            ProjectInventoryCounts counts = ProjectInventoryCounts.Of(p.Dependencies);
            int toUpdate = counts.MinorUpdates + counts.MajorUpdates;
            int vulnerableDeps = p.Dependencies.Count(d => d.Vulnerabilities.Any());
            int criticals = counts.CriticalVulnerabilities;
            int eolRuntimes = RuntimeGrouping.ByName(p.Runtimes).Count(FindingRules.IsEol);

            sumDeps += p.Dependencies.Count;
            sumUpdate += toUpdate;
            sumVuln += vulnerableDeps;
            sumCrit += criticals;
            sumEol += eolRuntimes;

            SetCountCell(ws.Cell(row, 4), p.Dependencies.Count);
            SetCountCell(ws.Cell(row, 5), toUpdate, OrangeFg);
            SetCountCell(ws.Cell(row, 6), vulnerableDeps, OrangeFg);
            SetCountCell(ws.Cell(row, 7), criticals, RedFg);
            SetCountCell(ws.Cell(row, 8), eolRuntimes, RedFg);

            if (p.LastScanAt.HasValue)
                SetDateCell(ws.Cell(row, 9), p.LastScanAt.Value, L.DateFormat);
            else
                SetPlaceholderCell(ws.Cell(row, 9));
        }

        int lastDataRow = projects.Count > 0 ? projects.Count + FirstDataRow - 1 : HeaderRow;
        ApplyDataBlockStyle(ws, FirstDataRow, lastDataRow, headers.Length);

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

    private void WriteProjectSheet(XLWorkbook wb, Project project, string sheetName, ExportLabels L)
    {
        IXLWorksheet ws = wb.Worksheets.Add(sheetName);

        int currentRow = 1;

        string[] runtimeHeaders = L.RuntimeHeaders;
        ApplySectionTitle(ws, currentRow, runtimeHeaders.Length, L.SectionRuntimes);
        currentRow++;
        ApplyHeadersAtRow(ws, runtimeHeaders, currentRow);
        currentRow++;

        List<Runtime> runtimes = project.Runtimes.OrderBy(r => r.Name).ToList();
        int firstRuntimeRow = currentRow;
        for (int i = 0; i < runtimes.Count; i++)
        {
            Runtime r = runtimes[i];
            SetRowBackground(ws, currentRow, runtimeHeaders.Length, i % 2 == 1 ? AltRowColor : XLColor.White);
            ws.Cell(currentRow, 1).Value = r.Name;
            ws.Cell(currentRow, 2).Value = r.Version;

            if (r.EolDate.HasValue)
                SetDateCell(ws.Cell(currentRow, 3), r.EolDate.Value, L.DateFormat);
            else
                SetPlaceholderCell(ws.Cell(currentRow, 3));

            (string rtLabel, XLColor rtFg) = RuntimeStatus(r, L);
            IXLCell statusCell = ws.Cell(currentRow, 4);
            statusCell.Value = rtLabel;
            statusCell.Style.Font.FontColor = rtFg;
            statusCell.Style.Font.Bold = true;
            statusCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            currentRow++;
        }

        ApplyDataBlockStyle(ws, firstRuntimeRow, currentRow - 1, runtimeHeaders.Length);

        if (runtimes.Count == 0)
        {
            ApplyEmptyRow(ws, currentRow, runtimeHeaders.Length, L.NoRuntimes);
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

        int firstDependencyRow = currentRow;
        for (int i = 0; i < deps.Count; i++)
        {
            Dependency d = deps[i];
            SetRowBackground(ws, currentRow, depHeaders.Length, i % 2 == 1 ? AltRowColor : XLColor.White);

            ws.Cell(currentRow, 1).Value = d.Name;
            ws.Cell(currentRow, 2).Value = d.CurrentVersion;

            if (!string.IsNullOrEmpty(d.LatestVersion))
                ws.Cell(currentRow, 3).Value = d.LatestVersion;
            else
                SetPlaceholderCell(ws.Cell(currentRow, 3));

            ws.Cell(currentRow, 4).Value = d.Ecosystem.ToString();
            ws.Cell(currentRow, 5).Value = TranslateDependencyType(d.Type, L);

            ApplyStatusCell(ws.Cell(currentRow, 6), TranslateDependencyStatus(d.Status, L), DepStatusColor(d.Status));

            SetCountCell(ws.Cell(currentRow, 7), d.Vulnerabilities.Count, RedFg);

            currentRow++;
        }

        ApplyDataBlockStyle(ws, firstDependencyRow, currentRow - 1, depHeaders.Length);

        if (deps.Count == 0)
        {
            ApplyEmptyRow(ws, currentRow, depHeaders.Length, L.NoDependencies);
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

        ApplyHeadersAtRow(ws, vulnHeaders, currentRow);
        currentRow++;

        if (vulnPairs.Count == 0)
        {
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
            int firstVulnerabilityRow = currentRow;
            for (int i = 0; i < vulnPairs.Count; i++)
            {
                (Dependency dep, Vulnerability v) = vulnPairs[i];
                SetRowBackground(ws, currentRow, vulnHeaders.Length, i % 2 == 1 ? AltRowColor : XLColor.White, autoHeight: true);

                ws.Cell(currentRow, 1).Value = VulnerabilityIdentity.Of(v);
                ws.Cell(currentRow, 1).Style.Font.FontColor = LinkColor;

                IXLCell cvssCell = ws.Cell(currentRow, 2);
                cvssCell.Value = (double)v.CvssScore;
                cvssCell.Style.NumberFormat.Format = "0.0";
                cvssCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                XLColor sevFg = SeverityColor(v.Severity);
                cvssCell.Style.Font.FontColor = sevFg;
                cvssCell.Style.Font.Bold = true;

                ApplyStatusCell(ws.Cell(currentRow, 3), TranslateSeverity(v.Severity, L), sevFg);

                ws.Cell(currentRow, 4).Value = dep.Name;

                if (!string.IsNullOrEmpty(v.FixedVersion))
                    ws.Cell(currentRow, 5).Value = v.FixedVersion;
                else
                    SetPlaceholderCell(ws.Cell(currentRow, 5));

                ws.Cell(currentRow, 6).Value = v.Description;
                ws.Cell(currentRow, 6).Style.Alignment.WrapText = true;

                currentRow++;
            }

            ApplyDataBlockStyle(ws, firstVulnerabilityRow, currentRow - 1, vulnHeaders.Length, autoHeight: true);
        }

        FinalizeSheet(ws, Math.Max(runtimeHeaders.Length, Math.Max(depHeaders.Length, vulnHeaders.Length)), 0, 0, 0, 0);
    }

}
