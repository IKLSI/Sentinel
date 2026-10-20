using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.TechHealth.ComplianceReport;

public partial class ComplianceReportService
{
    private static Document Compose(ReportData data) => Document.Create(container =>
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

    private static void ComposeContent(IContainer container, ReportData data)
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

    private static void ComposeTitleBlock(IContainer container, ReportData data)
    {
        container.Column(column =>
        {
            column.Item().Text(data.Labels.Title).FontSize(22).Bold().FontColor(Navy);
            column.Item().PaddingTop(4).Text(data.ProjectName).FontSize(13).FontColor(Ink);
            if (!string.IsNullOrWhiteSpace(data.RepositoryUrl))
                column.Item().Text(data.RepositoryUrl).FontSize(8).FontColor(Muted);
        });
    }

    private static void ComposeSummary(IContainer container, ReportData data)
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

    private static void ComposeControls(IContainer container, ReportData data)
    {
        container.Column(column =>
        {
            column.Item().Element(SectionTitle(data.Labels.SectionControls));

            column.Item().PaddingTop(8).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(3.2f);
                    columns.RelativeColumn(1.6f);
                    columns.ConstantColumn(70);
                });

                table.Header(header =>
                {
                    HeaderCell(header, data.Labels.HeaderRequirement);
                    HeaderCell(header, data.Labels.HeaderFramework);
                    HeaderCell(header, data.Labels.HeaderStatus);
                });

                foreach (ControlRow control in data.Controls)
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
        });
    }

    private static void ComposeVulnerabilities(IContainer container, ReportData data)
    {
        container.Column(column =>
        {
            column.Item().Element(SectionTitle(data.Labels.SectionVulnerabilities(data.TotalVulnerabilities)));

            column.Item().PaddingTop(8).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(2f);
                    columns.RelativeColumn(2f);
                    columns.ConstantColumn(70);
                    columns.RelativeColumn(1.4f);
                });

                table.Header(header =>
                {
                    HeaderCell(header, data.Labels.HeaderComponent);
                    HeaderCell(header, data.Labels.HeaderReference);
                    HeaderCell(header, data.Labels.HeaderSeverity);
                    HeaderCell(header, data.Labels.HeaderFix);
                });

                foreach (Vulnerability vulnerability in data.Vulnerabilities)
                {
                    table.Cell().Padding(6).Text(vulnerability.PackageName).FontSize(8.5f).FontColor(Ink);
                    table.Cell().Padding(6).Text(vulnerability.CveId).FontSize(8).FontColor(Muted);
                    table.Cell().Padding(6).Text(SeverityLabel(vulnerability.Severity, data.Labels))
                        .FontSize(8).Bold().FontColor(SeverityColor(vulnerability.Severity));
                    table.Cell().Padding(6).Text(vulnerability.FixedVersion ?? "—").FontSize(8).FontColor(Muted);
                }
            });

            if (data.VulnerabilitiesTruncated)
                column.Item().PaddingTop(4)
                    .Text(data.Labels.VulnerabilitiesHidden(data.TotalVulnerabilities - data.Vulnerabilities.Count))
                    .FontSize(7.5f).FontColor(Muted);
        });
    }

    private static void ComposeEolRuntimes(IContainer container, ReportData data)
    {
        container.Column(column =>
        {
            column.Item().Element(SectionTitle(data.Labels.SectionEolRuntimes(data.EolRuntimeCount)));

            column.Item().PaddingTop(8).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(2f);
                    columns.RelativeColumn(1.5f);
                    columns.RelativeColumn(1.5f);
                });

                table.Header(header =>
                {
                    HeaderCell(header, data.Labels.HeaderRuntime);
                    HeaderCell(header, data.Labels.HeaderVersion);
                    HeaderCell(header, data.Labels.HeaderSupportEnds);
                });

                foreach (Runtime runtime in data.EolRuntimes)
                {
                    table.Cell().Padding(6).Text(runtime.Name).FontSize(8.5f).FontColor(Ink);
                    table.Cell().Padding(6).Text(runtime.Version).FontSize(8).FontColor(Muted);
                    table.Cell().Padding(6).Text(runtime.EolDate is { } date
                            ? date.ToString(data.Labels.DateFormat)
                            : data.Labels.EolReached)
                        .FontSize(8).Bold().FontColor(Brick);
                }
            });
        });
    }

    private static void ComposeAuditTrail(IContainer container, ReportData data)
    {
        container.Column(column =>
        {
            column.Item().Element(SectionTitle(data.Labels.SectionAuditTrail(data.AuditTrail.Count)));

            column.Item().PaddingTop(8).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(90);
                    columns.RelativeColumn(1.6f);
                    columns.RelativeColumn(1.4f);
                });

                table.Header(header =>
                {
                    HeaderCell(header, data.Labels.HeaderEventDate);
                    HeaderCell(header, data.Labels.HeaderEventAction);
                    HeaderCell(header, data.Labels.HeaderEventUser);
                });

                foreach (ComplianceAuditLogRow entry in data.AuditTrail)
                {
                    string user = entry.UserEmail != null
                        ? ($"{entry.UserFirstName} {entry.UserLastName}".Trim() is { Length: > 0 } name
                            ? name
                            : entry.UserEmail)
                        : data.Labels.EventSystemUser;

                    table.Cell().Padding(6)
                        .Text($"{entry.CreatedAt.ToString(data.Labels.DateFormat)} {entry.CreatedAt:HH:mm}")
                        .FontSize(8).FontColor(Muted);
                    table.Cell().Padding(6).Text(data.Labels.AuditActionLabel(entry.Action))
                        .FontSize(8.5f).FontColor(Ink);
                    table.Cell().Padding(6).Text(user).FontSize(8).FontColor(Muted);
                }
            });
        });
    }

    private static void ComposeAttestation(IContainer container, ReportData data)
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

    private static void ComposeFooter(IContainer container, ReportData data)
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
}
