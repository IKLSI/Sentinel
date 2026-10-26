using ClosedXML.Excel;
using Sentinel.Application.Common;
using Sentinel.Domain.Entities;

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

    private static readonly XLColor GreenBg = XLColor.FromHtml(HealthPalette.Green.Soft);
    private static readonly XLColor GreenFg = XLColor.FromHtml(HealthPalette.Green.Ink);
    private static readonly XLColor GreenBg2 = XLColor.FromHtml("#D1FAE5");
    private static readonly XLColor GreenFg2 = XLColor.FromHtml(HealthPalette.Green.Solid);
    private static readonly XLColor GrayBg = XLColor.FromHtml(HealthPalette.Slate.Soft);
    private static readonly XLColor GrayFg = XLColor.FromHtml(HealthPalette.Slate.Ink);
    private static readonly XLColor OrangeBg = XLColor.FromHtml(HealthPalette.Orange.Soft);
    private static readonly XLColor OrangeFg = XLColor.FromHtml(HealthPalette.Orange.Ink);
    private static readonly XLColor YellowBg = XLColor.FromHtml(HealthPalette.Yellow.Soft);
    private static readonly XLColor YellowFg = XLColor.FromHtml(HealthPalette.Yellow.Ink);
    private static readonly XLColor RedBg = XLColor.FromHtml(HealthPalette.Red.Soft);
    private static readonly XLColor RedFg = XLColor.FromHtml(HealthPalette.Red.Ink);
    private static (XLColor bg, XLColor fg) TicketStatusColor(TicketStatus status) => status switch
    {
        TicketStatus.Resolved or TicketStatus.Closed => (GreenBg, GreenFg),
        TicketStatus.InProgress or TicketStatus.Testing => (OrangeBg, OrangeFg),
        _ => (GrayBg, GrayFg),
    };

    private static (XLColor bg, XLColor fg) ToneColor(PaletteTone tone) =>
        (XLColor.FromHtml(tone.Soft), XLColor.FromHtml(tone.Ink));

    private static (XLColor bg, XLColor fg) TicketPriorityColor(TicketPriority priority) =>
        ToneColor(HealthPalette.ForPriority(priority));

    private static (string label, XLColor fg) RuntimeStatus(Runtime r, ExportLabels L)
    {
        if (r.IsEol == true)
            return (L.RuntimeEol, RedFg);
        if (r.EolDate.HasValue && r.EolDate.Value < DateTime.UtcNow.AddMonths(6))
            return (L.RuntimeSoonEol, OrangeFg);
        if (r.IsEol == null)
            return (L.RuntimeUnknown, GrayFg);
        return (L.RuntimeActive, GreenFg);
    }

    private static (XLColor bg, XLColor fg) GradeColor(string? grade) =>
        ToneColor(HealthPalette.ForGrade(grade) ?? HealthPalette.Slate);

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

    private static (XLColor bg, XLColor fg) SeverityColor(VulnerabilitySeverity severity) =>
        ToneColor(HealthPalette.ForSeverity(severity));

}
