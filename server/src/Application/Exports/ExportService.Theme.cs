using ClosedXML.Excel;
using Sentinel.Application.Common;
using Sentinel.Domain.Entities;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.Exports;
public partial class ExportService
{
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

    private static readonly XLColor GreenFg = XLColor.FromHtml(HealthPalette.Green.Ink);
    private static readonly XLColor GrayFg = XLColor.FromHtml(HealthPalette.Slate.Ink);
    private static readonly XLColor OrangeFg = XLColor.FromHtml(HealthPalette.Orange.Ink);
    private static readonly XLColor YellowFg = XLColor.FromHtml(HealthPalette.Yellow.Ink);
    private static readonly XLColor RedFg = XLColor.FromHtml(HealthPalette.Red.Ink);
    private static XLColor TicketStatusColor(TicketStatus status) => status switch
    {
        TicketStatus.Resolved or TicketStatus.Closed => GreenFg,
        TicketStatus.InProgress or TicketStatus.Testing => OrangeFg,
        _ => GrayFg,
    };

    private static XLColor ToneColor(PaletteTone tone) => XLColor.FromHtml(tone.Ink);

    private static XLColor TicketPriorityColor(TicketPriority priority) =>
        ToneColor(HealthPalette.ForPriority(priority));

    private static (string label, XLColor fg) RuntimeStatus(Runtime r, ExportLabels L) =>
        RuntimeEolAssessment.Of(r, DateTime.UtcNow).Status switch
        {
            RuntimeEolStatus.Eol => (L.RuntimeEol, RedFg),
            RuntimeEolStatus.Danger => (L.RuntimeImminentEol, OrangeFg),
            RuntimeEolStatus.Warn => (L.RuntimeSoonEol, BrandIndigoDeep),
            RuntimeEolStatus.Ok => (L.RuntimeActive, GreenFg),
            _ => (L.RuntimeUnknown, GrayFg),
        };

    private static XLColor GradeColor(string? grade) =>
        ToneColor(HealthPalette.ForGrade(grade) ?? HealthPalette.Slate);

    private static XLColor ScoreColor(int score) => GradeColor(HealthScoreCalculator.ToGrade(score));

    private static XLColor DepStatusColor(DependencyStatus status) => status switch
    {
        DependencyStatus.UpToDate => GreenFg,
        DependencyStatus.MinorUpdate => YellowFg,
        DependencyStatus.MajorUpdate => OrangeFg,
        DependencyStatus.EOL or DependencyStatus.Vulnerable => RedFg,
        _ => GrayFg,
    };

    private static XLColor SeverityColor(VulnerabilitySeverity severity) =>
        ToneColor(HealthPalette.ForSeverity(severity));

}
