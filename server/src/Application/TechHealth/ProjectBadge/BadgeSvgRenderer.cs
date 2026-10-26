using System.Globalization;
using System.Net;
using System.Text;
using Sentinel.Application.Common;

namespace Sentinel.Application.TechHealth.ProjectBadge;

public static class BadgeSvgRenderer
{
    public const string DefaultLabel = "Sentinel";
    public const string UnknownValue = "inconnu";

    private const string LabelColor = "#475569";
    private const string UnknownColor = "#6b7a99";
    private const int Height = 20;
    private const int CharacterWidth = 7;
    private const int HorizontalPadding = 10;
    private const int MaximumLabelLength = 24;

    public static VersionedContent RenderContent(string label, string? grade, int? score) =>
        VersionedContent.FromBytes(Encoding.UTF8.GetBytes(Render(label, grade, score)), "image/svg+xml");

    public static string Render(string label, string? grade, int? score)
    {
        string displayedLabel = DisplayedLabel(label);

        PaletteTone? gradeTone = HealthPalette.ForGrade(grade);
        bool isKnown = gradeTone != null && score != null;
        string value = isKnown ? $"{grade} · {score!.Value.ToString(CultureInfo.InvariantCulture)}" : UnknownValue;
        string valueColor = isKnown ? gradeTone!.Value.Solid : UnknownColor;

        int labelWidth = displayedLabel.Length * CharacterWidth + HorizontalPadding * 2;
        int valueWidth = value.Length * CharacterWidth + HorizontalPadding * 2;
        int totalWidth = labelWidth + valueWidth;
        string accessibleLabel = WebUtility.HtmlEncode($"{displayedLabel}: {value}");

        StringBuilder svg = new();
        svg.Append($"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"{totalWidth}\" height=\"{Height}\" role=\"img\" aria-label=\"{accessibleLabel}\">");
        svg.Append($"<title>{accessibleLabel}</title>");
        svg.Append($"<clipPath id=\"r\"><rect width=\"{totalWidth}\" height=\"{Height}\" rx=\"3\"/></clipPath>");
        svg.Append("<g clip-path=\"url(#r)\">");
        svg.Append($"<rect width=\"{labelWidth}\" height=\"{Height}\" fill=\"{LabelColor}\"/>");
        svg.Append($"<rect x=\"{labelWidth}\" width=\"{valueWidth}\" height=\"{Height}\" fill=\"{valueColor}\"/>");
        svg.Append("</g>");
        svg.Append("<g fill=\"#fff\" text-anchor=\"middle\" font-family=\"Verdana,Geneva,DejaVu Sans,sans-serif\" font-size=\"11\">");
        svg.Append($"<text x=\"{labelWidth / 2}\" y=\"14\">{WebUtility.HtmlEncode(displayedLabel)}</text>");
        svg.Append($"<text x=\"{labelWidth + valueWidth / 2}\" y=\"14\" font-weight=\"bold\">{value}</text>");
        svg.Append("</g></svg>");

        return svg.ToString();
    }

    private static string DisplayedLabel(string label)
    {
        string cleaned = new(label.Select(character => char.IsControl(character) ? ' ' : character).ToArray());
        string trimmed = cleaned.Trim();

        if (trimmed.Length == 0) return DefaultLabel;

        return trimmed.Length <= MaximumLabelLength ? trimmed : trimmed[..(MaximumLabelLength - 1)] + "…";
    }
}
