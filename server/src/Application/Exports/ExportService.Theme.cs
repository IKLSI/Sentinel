using ClosedXML.Excel;
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

    private static readonly XLColor GreenBg = XLColor.FromHtml("#DCFCE7");
    private static readonly XLColor GreenFg = XLColor.FromHtml("#15803D");
    private static readonly XLColor GreenBg2 = XLColor.FromHtml("#D1FAE5");
    private static readonly XLColor GreenFg2 = XLColor.FromHtml("#16A34A");
    private static readonly XLColor GrayBg = XLColor.FromHtml("#F1F5F9");
    private static readonly XLColor GrayFg = XLColor.FromHtml("#475569");
    private static readonly XLColor OrangeBg = XLColor.FromHtml("#FFEDD5");
    private static readonly XLColor OrangeFg = XLColor.FromHtml("#C2410C");
    private static readonly XLColor YellowBg = XLColor.FromHtml("#FEF3C7");
    private static readonly XLColor YellowFg = XLColor.FromHtml("#B45309");
    private static readonly XLColor RedBg = XLColor.FromHtml("#FEE2E2");
    private static readonly XLColor RedFg = XLColor.FromHtml("#B91C1C");
    private static (XLColor bg, XLColor fg) TicketStatusColor(TicketStatus status) => status switch
    {
        TicketStatus.Resolved or TicketStatus.Closed => (GreenBg, GreenFg),
        TicketStatus.InProgress or TicketStatus.Testing => (OrangeBg, OrangeFg),
        _ => (GrayBg, GrayFg),
    };

    private static (XLColor bg, XLColor fg) TicketPriorityColor(string priority) => priority switch
    {
        "Critical" => (RedBg, RedFg),
        "High" => (OrangeBg, OrangeFg),
        "Medium" => (YellowBg, YellowFg),
        _ => (GrayBg, GrayFg),
    };

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

    private static (XLColor bg, XLColor fg) GradeColor(string? grade) => grade switch
    {
        null => (GrayBg, GrayFg),
        "A" => (GreenBg, GreenFg),
        "B" => (GreenBg2, GreenFg2),
        "C" => (YellowBg, YellowFg),
        "D" => (OrangeBg, OrangeFg),
        "E" => (OrangeBg, XLColor.FromHtml("#9A3412")),
        _ => (RedBg, RedFg),
    };

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

    private static (XLColor bg, XLColor fg) SeverityColor(string severity) => severity switch
    {
        "Critical" => (RedBg, RedFg),
        "High" => (OrangeBg, OrangeFg),
        "Medium" => (YellowBg, YellowFg),
        _ => (GrayBg, GrayFg),
    };

}
