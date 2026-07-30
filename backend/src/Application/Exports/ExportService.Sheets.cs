using ClosedXML.Excel;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Exports;
public partial class ExportService
{
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

}
