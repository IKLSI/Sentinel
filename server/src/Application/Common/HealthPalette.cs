using Sentinel.Domain.Entities;

namespace Sentinel.Application.Common;

public readonly record struct PaletteTone(string Solid, string Ink, string Soft);

public static class HealthPalette
{
    public static readonly PaletteTone Green = new("#16a34a", "#15803d", "#dcfce7");
    public static readonly PaletteTone Teal = new("#0d9488", "#0f766e", "#ccfbf1");
    public static readonly PaletteTone Yellow = new("#d97706", "#b45309", "#fef3c7");
    public static readonly PaletteTone Orange = new("#ea580c", "#c2410c", "#ffedd5");
    public static readonly PaletteTone Red = new("#dc2626", "#b91c1c", "#fee2e2");
    public static readonly PaletteTone Slate = new("#64748b", "#475569", "#f1f5f9");

    public static PaletteTone? ForGrade(string? grade) => grade switch
    {
        "A" => Green,
        "B" => Teal,
        "C" => Yellow,
        "D" => Orange,
        "E" or "F" => Red,
        _ => null
    };

    public static PaletteTone ForSeverity(VulnerabilitySeverity severity) => severity switch
    {
        VulnerabilitySeverity.Critical => Red,
        VulnerabilitySeverity.High => Orange,
        VulnerabilitySeverity.Medium => Yellow,
        _ => Slate
    };

    public static PaletteTone ForPriority(TicketPriority priority) => priority switch
    {
        TicketPriority.Critical => Red,
        TicketPriority.High => Orange,
        TicketPriority.Medium => Yellow,
        _ => Slate
    };
}
