using Sentinel.Application.Exports;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.TechHealth.ComplianceReport;

public class ComplianceReportService(
    IProjectRepository projectRepository,
    IOrganizationRepository organizationRepository,
    IUserRepository userRepository,
    ILocalizer localizer)
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

    private const int MaxVulnerabilityRows = 30;

    public async Task<ExportResult?> GenerateAsync(Guid projectId, Guid organizationId, Guid currentUserId,
        CancellationToken cancellationToken)
    {
        Project? project = await projectRepository
            .GetOrDefaultInOrganizationWithHealthDetailsAsync(projectId, organizationId, cancellationToken);

        if (project == null) return null;

        Organization? organization = await organizationRepository.GetOrDefaultAsync(organizationId,
            QueryTracking.NoTracking, cancellationToken);

        string? language = await userRepository.GetLanguageOrDefaultAsync(currentUserId, cancellationToken);
        ComplianceReportLabels labels = new(localizer, ComplianceReportLabels.ResolveCulture(language));

        ReportData data = BuildData(project, organization?.Name ?? labels.OrganizationFallback, labels);
        byte[] pdf = Compose(data).GeneratePdf();
        string slug = ExportFileName.Slugify(project.Name);

        return new ExportResult(pdf, $"{labels.Slug}-{slug}.pdf");
    }

    private static ReportData BuildData(Project project, string organizationName, ComplianceReportLabels labels)
    {
        List<Vulnerability> vulnerabilities = project.Dependencies
            .SelectMany(d => d.Vulnerabilities)
            .OrderBy(v => v.Severity)
            .ThenByDescending(v => v.CvssScore)
            .ToList();

        List<Runtime> eolRuntimes = project.Runtimes
            .Where(r => r.IsEol == true)
            .OrderBy(r => r.Name)
            .ToList();

        return new ReportData
        {
            Labels = labels,
            ProjectName = project.Name,
            OrganizationName = organizationName,
            RepositoryUrl = project.RepositoryUrl,
            GeneratedAt = DateTime.UtcNow,
            LastScanAt = project.LastScanAt,
            HealthScore = project.HealthScore,
            HealthGrade = project.HealthGrade,
            TotalDependencies = project.Dependencies.Count,
            CriticalCount = vulnerabilities.Count(v => v.Severity == VulnerabilitySeverity.Critical),
            HighCount = vulnerabilities.Count(v => v.Severity == VulnerabilitySeverity.High),
            TotalVulnerabilities = vulnerabilities.Count,
            EolRuntimeCount = eolRuntimes.Count,
            Vulnerabilities = vulnerabilities,
            EolRuntimes = eolRuntimes,
            Controls = BuildControls(vulnerabilities, eolRuntimes, labels)
        };
    }

    private static List<ControlRow> BuildControls(List<Vulnerability> vulnerabilities, List<Runtime> eolRuntimes,
        ComplianceReportLabels labels)
    {
        bool hasUnfixableVulnerabilities = vulnerabilities.Any(v => string.IsNullOrWhiteSpace(v.FixedVersion));

        return new List<ControlRow>
        {
            new(labels.ControlSbomRequirement, "NIS2 · CRA · DORA", ControlStatus.Covered,
                labels.ControlSbomDetail),
            new(labels.ControlCveRequirement, "NIS2 · DORA", ControlStatus.Covered,
                labels.ControlCveDetail),
            new(labels.ControlEolRequirement, "CRA", eolRuntimes.Count == 0 ? ControlStatus.Covered : ControlStatus.Attention,
                eolRuntimes.Count == 0 ? labels.ControlEolDetailOk : labels.ControlEolDetailWarn(eolRuntimes.Count)),
            new(labels.ControlTraceabilityRequirement, "DORA", ControlStatus.Covered,
                labels.ControlTraceabilityDetail),
            new(labels.ControlPatchingRequirement, "NIS2", hasUnfixableVulnerabilities ? ControlStatus.Partial : ControlStatus.Covered,
                hasUnfixableVulnerabilities ? labels.ControlPatchingDetailWarn : labels.ControlPatchingDetailOk)
        };
    }

    private static Document Compose(ReportData data) => Document.Create(container =>
    {
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(40);
            page.DefaultTextStyle(x => x.FontSize(9).FontColor(Ink).LineHeight(1.35f));

            page.Header().Element(header => ComposeHeader(header, data.Labels));
            page.Content().PaddingVertical(18).Element(content => ComposeContent(content, data));
            page.Footer().Element(footer => ComposeFooter(footer, data));
        });
    });

    private static void ComposeHeader(IContainer container, ComplianceReportLabels labels)
    {
        container.BorderBottom(1).BorderColor(Line).PaddingBottom(8).Row(row =>
        {
            row.RelativeItem().Text(text =>
            {
                text.Span("SENTINEL").FontSize(11).Bold().FontColor(Navy).LetterSpacing(0.15f);
                text.Span($"  ·  {labels.Title}").FontSize(9).FontColor(Muted);
            });

            row.ConstantItem(160).AlignRight().Text(labels.Tagline)
                .FontSize(8).FontColor(Muted);
        });
    }

    private static void ComposeContent(IContainer container, ReportData data)
    {
        container.Column(column =>
        {
            column.Spacing(18);

            column.Item().Element(title => ComposeTitleBlock(title, data));
            column.Item().Element(summary => ComposeSummary(summary, data));
            column.Item().Element(controls => ComposeControls(controls, data));

            if (data.Vulnerabilities.Count > 0)
                column.Item().Element(vulns => ComposeVulnerabilities(vulns, data));

            if (data.EolRuntimes.Count > 0)
                column.Item().Element(eol => ComposeEolRuntimes(eol, data));

            column.Item().Element(attestation => ComposeAttestation(attestation, data));
        });
    }

    private static void ComposeTitleBlock(IContainer container, ReportData data)
    {
        container.Row(row =>
        {
            row.RelativeItem().Column(column =>
            {
                column.Item().Text(data.Labels.Title).FontSize(22).Bold().FontColor(Navy);
                column.Item().PaddingTop(4).Text(data.ProjectName).FontSize(13).FontColor(Ink);
                column.Item().PaddingTop(2).Text(data.OrganizationName).FontSize(9).FontColor(Muted);
                if (!string.IsNullOrWhiteSpace(data.RepositoryUrl))
                    column.Item().Text(data.RepositoryUrl).FontSize(8).FontColor(Muted);
            });

            row.ConstantItem(96).AlignRight().Column(column =>
            {
                column.Item().AlignRight().Text(data.HealthGrade ?? "—")
                    .FontSize(34).Bold().FontColor(GradeColor(data.HealthScore));
                column.Item().AlignRight().Text(data.HealthScore is { } score ? $"{score} / 100" : data.Labels.GradeNotCovered)
                    .FontSize(8).FontColor(Muted);
            });
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
        IContainer cell = row.RelativeItem().Padding(12);
        if (withBorder) cell = cell.BorderRight(1).BorderColor(Line);

        cell.Column(column =>
        {
            column.Item().Text(label.ToUpperInvariant()).FontSize(7).FontColor(Muted).LetterSpacing(0.08f);
            column.Item().PaddingTop(4).Text(value).FontSize(22).Bold().FontColor(valueColor);
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
        List<Vulnerability> rows = data.Vulnerabilities.Take(MaxVulnerabilityRows).ToList();
        int hidden = data.Vulnerabilities.Count - rows.Count;

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

                foreach (Vulnerability vulnerability in rows)
                {
                    table.Cell().Padding(6).Text(vulnerability.PackageName).FontSize(8.5f).FontColor(Ink);
                    table.Cell().Padding(6).Text(vulnerability.CveId).FontSize(8).FontColor(Muted);
                    table.Cell().Padding(6).Text(SeverityLabel(vulnerability.Severity, data.Labels))
                        .FontSize(8).Bold().FontColor(SeverityColor(vulnerability.Severity));
                    table.Cell().Padding(6).Text(vulnerability.FixedVersion ?? "—").FontSize(8).FontColor(Muted);
                }
            });

            if (hidden > 0)
                column.Item().PaddingTop(6).Text(data.Labels.VulnerabilitiesHidden(hidden))
                    .FontSize(7.5f).Italic().FontColor(Muted);
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
        });
    }

    private static void ComposeFooter(IContainer container, ReportData data)
    {
        container.BorderTop(1).BorderColor(Line).PaddingTop(6).Row(row =>
        {
            row.RelativeItem().Text($"SENTINEL · {data.OrganizationName} · {data.Labels.FooterConfidential}")
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

    private static Action<IContainer> SectionTitle(string title) => container =>
        container.BorderBottom(2).BorderColor(Navy).PaddingBottom(4)
            .Text(title).FontSize(12).Bold().FontColor(Navy);

    private static void HeaderCell(TableCellDescriptor header, string label) =>
        header.Cell().Background(Navy).Padding(7).Text(label)
            .FontSize(7.5f).Bold().FontColor(White).LetterSpacing(0.06f);

    private static string GradeColor(int? score) => score switch
    {
        >= 75 => Teal,
        >= 45 => Amber,
        null => Muted,
        _ => Brick
    };

    private static string StatusLabel(ControlStatus status, ComplianceReportLabels labels) => status switch
    {
        ControlStatus.Covered => labels.StatusCovered,
        ControlStatus.Partial => labels.StatusPartial,
        _ => labels.StatusAttention
    };

    private static string StatusColor(ControlStatus status) => status switch
    {
        ControlStatus.Covered => Teal,
        ControlStatus.Partial => Amber,
        _ => Brick
    };

    private static string SeverityLabel(VulnerabilitySeverity severity, ComplianceReportLabels labels) => severity switch
    {
        VulnerabilitySeverity.Critical => labels.SeverityCritical,
        VulnerabilitySeverity.High => labels.SeverityHigh,
        VulnerabilitySeverity.Medium => labels.SeverityMedium,
        _ => labels.SeverityLow
    };

    private static string SeverityColor(VulnerabilitySeverity severity) => severity switch
    {
        VulnerabilitySeverity.Critical => Brick,
        VulnerabilitySeverity.High => Amber,
        VulnerabilitySeverity.Medium => Muted,
        _ => Muted
    };

    private enum ControlStatus
    {
        Covered,
        Partial,
        Attention
    }

    private sealed record ControlRow(string Requirement, string Framework, ControlStatus Status, string Detail);

    private sealed class ReportData
    {
        public required ComplianceReportLabels Labels { get; init; }
        public string ProjectName { get; init; } = string.Empty;
        public string OrganizationName { get; init; } = string.Empty;
        public string? RepositoryUrl { get; init; }
        public DateTime GeneratedAt { get; init; }
        public DateTime? LastScanAt { get; init; }
        public int? HealthScore { get; init; }
        public string? HealthGrade { get; init; }
        public int TotalDependencies { get; init; }
        public int CriticalCount { get; init; }
        public int HighCount { get; init; }
        public int TotalVulnerabilities { get; init; }
        public int EolRuntimeCount { get; init; }
        public List<Vulnerability> Vulnerabilities { get; init; } = new();
        public List<Runtime> EolRuntimes { get; init; } = new();
        public List<ControlRow> Controls { get; init; } = new();
    }
}
