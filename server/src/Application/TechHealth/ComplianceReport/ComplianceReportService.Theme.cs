using QuestPDF.Fluent;
using QuestPDF.Infrastructure;
using Sentinel.Application.Common;
using Sentinel.Domain.Entities;

namespace Sentinel.Application.TechHealth.ComplianceReport;

public partial class ComplianceReportService
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

    private static Action<IContainer> SectionTitle(string title) => container =>
        container.BorderBottom(2).BorderColor(Navy).PaddingBottom(4)
            .Text(title).FontSize(12).Bold().FontColor(Navy);

    private static void HeaderCell(TableCellDescriptor header, string label) =>
        header.Cell().Background(Navy).Padding(7).Text(label)
            .FontSize(7.5f).Bold().FontColor(White).LetterSpacing(0.06f);

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

    private static string SeverityColor(VulnerabilitySeverity severity) =>
        HealthPalette.ForSeverity(severity).Ink;
}
