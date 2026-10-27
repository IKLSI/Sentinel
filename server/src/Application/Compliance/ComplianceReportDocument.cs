using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Sentinel.Application.Common;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Compliance;

internal static class ComplianceReportDocument
{
    private const string Navy = "#1C2B40";
    private const string Ink = "#16202E";
    private const string Teal = "#12776A";
    private const string Amber = "#B0741E";
    private const string Brick = "#9E3427";
    private const string Muted = "#5B6675";
    private const string Line = "#DDE3EA";
    private const string Panel = "#F1F4F7";
    private const string White = "#FFFFFF";

    public static Document Compose(ComplianceReportData data) => Document.Create(container =>
    {
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(40);
            page.DefaultTextStyle(x => x.FontSize(9).FontColor(Ink).LineHeight(1.35f));

            page.Content().PaddingVertical(18).Element(content => ComposeContent(content, data));
            page.Footer().Element(footer => ComposeFooter(footer, data));
        });
    });

    private static void ComposeContent(IContainer container, ComplianceReportData data)
    {
        container.Column(column =>
        {
            column.Spacing(18);

            column.Item().Element(title => ComposeTitleBlock(title, data));
            column.Item().Element(summary => ComposeSummary(summary, data));
            column.Item().Element(controls => ComposeControls(controls, data));

            if (data.Vulnerabilities.Count > 0)
            {
                column.Item().PageBreak();
                column.Item().Element(vulns => ComposeVulnerabilities(vulns, data));
            }

            if (data.EolRuntimes.Count > 0)
                column.Item().Element(eol => ComposeEolRuntimes(eol, data));

            if (data.AuditTrail.Count > 0)
                column.Item().Element(audit => ComposeAuditTrail(audit, data));

            column.Item().Element(attestation => ComposeAttestation(attestation, data));
        });
    }

    private static void ComposeTitleBlock(IContainer container, ComplianceReportData data)
    {
        container.Column(column =>
        {
            column.Item().Text(data.Labels.Title).FontSize(22).Bold().FontColor(Navy);
            column.Item().PaddingTop(4).Text(data.ProjectName).FontSize(13).FontColor(Ink);
            if (!string.IsNullOrWhiteSpace(data.RepositoryUrl))
                column.Item().Text(data.RepositoryUrl).FontSize(8).FontColor(Muted);
        });
    }

    private static void ComposeSummary(IContainer container, ComplianceReportData data)
    {
        container.Border(1).BorderColor(Line).Row(row =>
        {
            SummaryCell(row, data.Labels.SummaryDependencies, data.TotalDependencies.ToString(), Ink, true);
            SummaryCell(row, data.Labels.SummaryCritical, data.CriticalCount.ToString(), data.CriticalCount > 0 ? Brick : Ink, true);
            SummaryCell(row, data.Labels.SummaryVulnerabilities, data.TotalVulnerabilities.ToString(), data.TotalVulnerabilities > 0 ? Amber : Ink, true);
            SummaryCell(row, data.Labels.SummaryEolRuntimes, data.EolRuntimeCount.ToString(), data.EolRuntimeCount > 0 ? Brick : Ink, false);
        });
    }

    private static void SummaryCell(RowDescriptor row, string label, string value, string valueColor, bool withBorder)
    {
        IContainer cell = row.RelativeItem().Background(Panel).BorderTop(3).BorderColor(valueColor)
            .PaddingVertical(14).PaddingHorizontal(8);
        if (withBorder) cell = cell.BorderRight(1).BorderColor(Line);

        cell.Column(column =>
        {
            column.Item().Text(label.ToUpperInvariant()).FontSize(6.5f).FontColor(Muted).LetterSpacing(0.02f);
            column.Item().PaddingTop(5).Text(value).FontSize(24).Bold().FontColor(valueColor);
        });
    }

    private static void ComposeAttestation(IContainer container, ComplianceReportData data)
    {
        container.Background(Panel).Padding(14).Column(column =>
        {
            column.Item().Text(data.Labels.AttestationTitle).FontSize(8).Bold().FontColor(Teal).LetterSpacing(0.1f);
            column.Item().PaddingTop(4).Text(text =>
            {
                text.Span(data.Labels.AttestationIntro);
                text.Span($"{data.GeneratedAt.ToString(data.Labels.DateFormat)} {data.Labels.At} {data.GeneratedAt:HH:mm} UTC").Bold();
                text.Span(data.LastScanAt is { } scan
                    ? data.Labels.AttestationWithScan(scan.ToString(data.Labels.DateFormat))
                    : data.Labels.AttestationWithoutScan);
                text.Span(data.Labels.AttestationDisclaimer);
                text.DefaultTextStyle(style => style.FontSize(8).FontColor(Muted));
            });
            column.Item().PaddingTop(6).Text(text =>
            {
                string generatedByName = data.GeneratedByName?.Trim() is { Length: > 0 } name
                    ? name
                    : data.GeneratedByEmail ?? data.OrganizationName;

                text.Span(data.Labels.GeneratedBy(generatedByName));
                text.Span(" ");
                text.Span(data.Labels.ReportId($"{data.ReportId} · {data.ReportFingerprint}"));
                text.DefaultTextStyle(style => style.FontSize(7.5f).FontColor(Muted));
            });
        });
    }

    private static void ComposeFooter(IContainer container, ComplianceReportData data)
    {
        container.BorderTop(1).BorderColor(Line).PaddingTop(6).Row(row =>
        {
            row.RelativeItem().Text($"SENTINEL · {data.Labels.FooterConfidential}")
                .FontSize(7.5f).FontColor(Muted);

            row.ConstantItem(80).AlignRight().Text(text =>
            {
                text.DefaultTextStyle(style => style.FontSize(7.5f).FontColor(Muted));
                text.CurrentPageNumber();
                text.Span(" / ");
                text.TotalPages();
            });
        });
    }

    private static void ComposeControls(IContainer container, ComplianceReportData data) =>
        ComposeTableSection(container, data.Labels.SectionControls,
            columns =>
            {
                columns.RelativeColumn(3.2f);
                columns.RelativeColumn(1.6f);
                columns.ConstantColumn(70);
            },
            [data.Labels.HeaderRequirement, data.Labels.HeaderFramework, data.Labels.HeaderStatus],
            table =>
            {
                foreach (ComplianceControl control in data.Controls)
                {
                    table.Cell().Padding(7).Column(cell =>
                    {
                        cell.Item().Text(control.Requirement).FontSize(9).FontColor(Ink);
                        cell.Item().Text(control.Detail).FontSize(7.5f).FontColor(Muted);
                    });
                    table.Cell().Padding(7).AlignMiddle().Text(control.Framework).FontSize(8).FontColor(Muted);
                    table.Cell().Padding(7).AlignMiddle().Text(StatusLabel(control.Status, data.Labels))
                        .FontSize(8).Bold().FontColor(StatusColor(control.Status));
                }
            });

    private static void ComposeVulnerabilities(IContainer container, ComplianceReportData data) =>
        ComposeTableSection(container, data.Labels.SectionVulnerabilities(data.TotalVulnerabilities),
            columns =>
            {
                columns.RelativeColumn(2f);
                columns.RelativeColumn(2f);
                columns.ConstantColumn(70);
                columns.RelativeColumn(1.4f);
            },
            [data.Labels.HeaderComponent, data.Labels.HeaderReference, data.Labels.HeaderSeverity,
                data.Labels.HeaderFix],
            table =>
            {
                foreach (Vulnerability vulnerability in data.Vulnerabilities)
                {
                    table.Cell().Padding(6).Text(vulnerability.PackageName).FontSize(8.5f).FontColor(Ink);
                    table.Cell().Padding(6).Text(vulnerability.CveId).FontSize(8).FontColor(Muted);
                    table.Cell().Padding(6).Text(SeverityLabel(vulnerability.Severity, data.Labels))
                        .FontSize(8).Bold().FontColor(SeverityColor(vulnerability.Severity));
                    table.Cell().Padding(6).Text(vulnerability.FixedVersion ?? "—").FontSize(8).FontColor(Muted);
                }
            },
            column =>
            {
                if (!data.VulnerabilitiesTruncated) return;

                column.Item().PaddingTop(4)
                    .Text(data.Labels.VulnerabilitiesHidden(data.TotalVulnerabilities - data.Vulnerabilities.Count))
                    .FontSize(7.5f).FontColor(Muted);
            });

    private static void ComposeEolRuntimes(IContainer container, ComplianceReportData data) =>
        ComposeTableSection(container, data.Labels.SectionEolRuntimes(data.EolRuntimeCount),
            columns =>
            {
                columns.RelativeColumn(2f);
                columns.RelativeColumn(1.5f);
                columns.RelativeColumn(1.5f);
            },
            [data.Labels.HeaderRuntime, data.Labels.HeaderVersion, data.Labels.HeaderSupportEnds],
            table =>
            {
                foreach (Runtime runtime in data.EolRuntimes)
                {
                    table.Cell().Padding(6).Text(runtime.Name).FontSize(8.5f).FontColor(Ink);
                    table.Cell().Padding(6).Text(runtime.Version).FontSize(8).FontColor(Muted);
                    table.Cell().Padding(6).Text(EolDateLabel(runtime, data.Labels))
                        .FontSize(8).Bold().FontColor(Brick);
                }
            });

    private static void ComposeAuditTrail(IContainer container, ComplianceReportData data) =>
        ComposeTableSection(container, data.Labels.SectionAuditTrail(data.AuditTrail.Count),
            columns =>
            {
                columns.ConstantColumn(90);
                columns.RelativeColumn(1.6f);
                columns.RelativeColumn(1.4f);
            },
            [data.Labels.HeaderEventDate, data.Labels.HeaderEventAction, data.Labels.HeaderEventUser],
            table =>
            {
                foreach (ComplianceAuditLogRow entry in data.AuditTrail)
                {
                    table.Cell().Padding(6)
                        .Text($"{entry.CreatedAt.ToString(data.Labels.DateFormat)} {entry.CreatedAt:HH:mm}")
                        .FontSize(8).FontColor(Muted);
                    table.Cell().Padding(6).Text(data.Labels.AuditActionLabel(entry.Action))
                        .FontSize(8.5f).FontColor(Ink);
                    table.Cell().Padding(6).Text(AuditUserLabel(entry, data.Labels)).FontSize(8).FontColor(Muted);
                }
            });

    private static void ComposeTableSection(IContainer container, string title,
        Action<TableColumnsDefinitionDescriptor> defineColumns, IEnumerable<string> headers,
        Action<TableDescriptor> addRows, Action<ColumnDescriptor>? addFooter = null)
    {
        container.Column(column =>
        {
            column.Item().Element(SectionTitle(title));

            column.Item().PaddingTop(8).Table(table =>
            {
                table.ColumnsDefinition(defineColumns);

                table.Header(header =>
                {
                    foreach (string label in headers) HeaderCell(header, label);
                });

                addRows(table);
            });

            addFooter?.Invoke(column);
        });
    }

    private static string EolDateLabel(Runtime runtime, ComplianceReportLabels labels) =>
        runtime.EolDate is { } date ? date.ToString(labels.DateFormat) : labels.EolReached;

    private static string AuditUserLabel(ComplianceAuditLogRow entry, ComplianceReportLabels labels)
    {
        if (entry.UserEmail == null) return labels.EventSystemUser;

        string fullName = $"{entry.UserFirstName} {entry.UserLastName}".Trim();
        return fullName.Length > 0 ? fullName : entry.UserEmail;
    }

    private static Action<IContainer> SectionTitle(string title) => container =>
        container.BorderBottom(2).BorderColor(Navy).PaddingBottom(4)
            .Text(title).FontSize(12).Bold().FontColor(Navy);

    private static void HeaderCell(TableCellDescriptor header, string label) =>
        header.Cell().Background(Navy).Padding(7).Text(label)
            .FontSize(7.5f).Bold().FontColor(White).LetterSpacing(0.06f);

    private static string StatusLabel(ComplianceControlStatus status, ComplianceReportLabels labels) => status switch
    {
        ComplianceControlStatus.Covered => labels.StatusCovered,
        ComplianceControlStatus.Partial => labels.StatusPartial,
        _ => labels.StatusAttention
    };

    private static string StatusColor(ComplianceControlStatus status) => status switch
    {
        ComplianceControlStatus.Covered => Teal,
        ComplianceControlStatus.Partial => Amber,
        _ => Brick
    };

    private static string SeverityLabel(VulnerabilitySeverity severity, ComplianceReportLabels labels) => severity switch
    {
        VulnerabilitySeverity.Critical => labels.SeverityCritical,
        VulnerabilitySeverity.High => labels.SeverityHigh,
        VulnerabilitySeverity.Medium => labels.SeverityMedium,
        _ => labels.SeverityLow
    };

    private static string SeverityColor(VulnerabilitySeverity severity) =>
        HealthPalette.ForSeverity(severity).Ink;
}
