using System.Text.RegularExpressions;
using ClosedXML.Excel;
using Sentinel.Application.Common;
using Sentinel.Domain.Entities;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.Exports.Excel;

internal static class ExcelFormatting
{
    public static readonly XLColor BrandIndigo = XLColor.FromHtml("#6366F1");
    public static readonly XLColor BrandIndigoDeep = XLColor.FromHtml("#4F46E5");
    public static readonly XLColor SoftIndigoFill = XLColor.FromHtml("#E0E7FF");
    public static readonly XLColor MetaFill = XLColor.FromHtml("#EEF0FE");
    public static readonly XLColor HeaderText = XLColor.FromHtml("#1E293B");
    public static readonly XLColor MetaFg = XLColor.FromHtml("#64748B");
    public static readonly XLColor TotalBg = XLColor.FromHtml("#E0E7FF");
    public static readonly XLColor TotalFg = XLColor.FromHtml("#334155");
    public static readonly XLColor LinkColor = XLColor.FromHtml("#4F46E5");
    public static readonly XLColor AltRowColor = XLColor.FromHtml("#F1F3FD");
    public static readonly XLColor BorderColor = XLColor.FromHtml("#E2E8F0");

    public static readonly XLColor GreenFg = XLColor.FromHtml(HealthPalette.Green.Ink);
    public static readonly XLColor GrayFg = XLColor.FromHtml(HealthPalette.Slate.Ink);
    public static readonly XLColor OrangeFg = XLColor.FromHtml(HealthPalette.Orange.Ink);
    public static readonly XLColor YellowFg = XLColor.FromHtml(HealthPalette.Yellow.Ink);
    public static readonly XLColor RedFg = XLColor.FromHtml(HealthPalette.Red.Ink);

    public static XLColor StripeColor(int rowIndex) => rowIndex % 2 == 1 ? AltRowColor : XLColor.White;

    public static XLColor TicketStatusColor(TicketStatus status) => status switch
    {
        TicketStatus.Resolved or TicketStatus.Closed => GreenFg,
        TicketStatus.InProgress or TicketStatus.Testing => OrangeFg,
        _ => GrayFg,
    };

    public static XLColor TicketPriorityColor(TicketPriority priority) =>
        ToneColor(HealthPalette.ForPriority(priority));

    public static XLColor GradeColor(string? grade) =>
        ToneColor(HealthPalette.ForGrade(grade) ?? HealthPalette.Slate);

    public static XLColor ScoreColor(int score) => GradeColor(HealthScoreCalculator.ToGrade(score));

    public static XLColor DependencyStatusColor(DependencyStatus status) => status switch
    {
        DependencyStatus.UpToDate => GreenFg,
        DependencyStatus.MinorUpdate => YellowFg,
        DependencyStatus.MajorUpdate => OrangeFg,
        DependencyStatus.EOL or DependencyStatus.Vulnerable => RedFg,
        _ => GrayFg,
    };

    public static XLColor SeverityColor(VulnerabilitySeverity severity) =>
        ToneColor(HealthPalette.ForSeverity(severity));

    private static XLColor ToneColor(PaletteTone tone) => XLColor.FromHtml(tone.Ink);

    public const int TitleRow = 1;
    public const int MetaRow = 2;
    public const int HeaderRow = 3;
    public const int FirstDataRow = 4;

    private const string BaseFont = "Segoe UI";
    private const int MaxSheetNameLength = 28;
    private const int MinColumnWidth = 12;
    private const int MaxColumnWidth = 60;
    private const int AutoFitRowLimit = 300;

    public static string BuildMeta(ExportLabels L, string count, string? extra)
    {
        DateTime generatedAt = DateTime.UtcNow;
        string stamp = $"{L.GeneratedOn} {generatedAt.ToString(L.StampDateFormat)} {L.AtWord} {generatedAt:HH:mm}";
        string baseMeta = $"{stamp} · {count}";
        return string.IsNullOrEmpty(extra) ? baseMeta : $"{baseMeta} · {extra}";
    }

    public static void ApplyDocumentProperties(XLWorkbook wb, string subject)
    {
        wb.Properties.Author = "Sentinel";
        wb.Properties.Company = "Sentinel";
        wb.Properties.Title = subject;
        wb.Properties.Subject = subject;
        wb.Properties.Category = "Export";
    }

    public static void ApplyTitle(IXLWorksheet ws, string title, int colCount)
    {
        ws.Range(TitleRow, 1, TitleRow, colCount).Merge();
        IXLCell cell = ws.Cell(TitleRow, 1);
        cell.Value = title;
        cell.Style.Fill.BackgroundColor = SoftIndigoFill;
        cell.Style.Font.FontColor = BrandIndigoDeep;
        cell.Style.Font.Bold = true;
        cell.Style.Font.FontSize = 15;
        cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
        cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        cell.Style.Alignment.Indent = 1;
        cell.Style.Border.BottomBorder = XLBorderStyleValues.Thick;
        cell.Style.Border.BottomBorderColor = BrandIndigo;
        ws.Row(TitleRow).Height = 30;
    }

    public static void ApplyMetaRow(IXLWorksheet ws, int colCount, string text)
    {
        ws.Range(MetaRow, 1, MetaRow, colCount).Merge();
        IXLCell cell = ws.Cell(MetaRow, 1);
        cell.Value = text;
        cell.Style.Fill.BackgroundColor = MetaFill;
        cell.Style.Font.FontColor = MetaFg;
        cell.Style.Font.FontSize = 9;
        cell.Style.Font.Italic = true;
        cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
        cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        cell.Style.Alignment.Indent = 1;
        ws.Row(MetaRow).Height = 16;
    }

    public static void ApplyEmptyRow(IXLWorksheet ws, int row, int colCount, string text)
    {
        IXLCell cell = ws.Cell(row, 1);
        cell.Value = text;
        ws.Range(row, 1, row, colCount).Merge();
        cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        cell.Style.Font.FontColor = GrayFg;
        cell.Style.Font.Italic = true;
        ws.Row(row).Height = 18;
    }

    public static void ApplySectionTitle(IXLWorksheet ws, int row, int colCount, string title)
    {
        ws.Range(row, 1, row, colCount).Merge();
        IXLCell cell = ws.Cell(row, 1);
        cell.Value = title;
        cell.Style.Fill.BackgroundColor = SoftIndigoFill;
        cell.Style.Font.FontColor = BrandIndigoDeep;
        cell.Style.Font.Bold = true;
        cell.Style.Font.FontSize = 11;
        cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
        cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        cell.Style.Alignment.Indent = 1;
        cell.Style.Border.BottomBorder = XLBorderStyleValues.Medium;
        cell.Style.Border.BottomBorderColor = BrandIndigo;
        ws.Row(row).Height = 20;
    }

    public static void ApplyHeadersAtRow(IXLWorksheet ws, string[] headers, int row)
    {
        for (int col = 1; col <= headers.Length; col++)
        {
            IXLCell cell = ws.Cell(row, col);
            cell.Value = headers[col - 1];
            cell.Style.Fill.BackgroundColor = SoftIndigoFill;
            cell.Style.Font.FontColor = HeaderText;
            cell.Style.Font.Bold = true;
            cell.Style.Font.FontSize = 11;
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            cell.Style.Border.BottomBorder = XLBorderStyleValues.Medium;
            cell.Style.Border.BottomBorderColor = BrandIndigo;
        }
        ws.Row(row).Height = 22;
    }

    public static string UniqueSheetName(string baseName, HashSet<string> usedNames)
    {
        string sheetName = baseName;

        for (int count = 2; !usedNames.Add(sheetName); count++)
        {
            string suffix = $"_{count}";
            sheetName = baseName.Length + suffix.Length > MaxSheetNameLength
                ? baseName[..(MaxSheetNameLength - suffix.Length)] + suffix
                : baseName + suffix;
        }

        return sheetName;
    }

    public static string SafeSheetName(string name)
    {
        string cleaned = Regex.Replace(name, @"[/\\?\*\[\]:]", "_");
        return cleaned.Length > MaxSheetNameLength ? cleaned[..MaxSheetNameLength] : cleaned;
    }

    public static void FinalizeSheet(IXLWorksheet ws, int colCount, int freezeRow, int filterHeaderRow, int filterLastRow, int repeatTop)
    {
        IXLRange? used = ws.RangeUsed();
        if (used != null) used.Style.Font.FontName = BaseFont;

        for (int col = 1; col <= colCount; col++)
        {
            ws.Column(col).AdjustToContents(1, AutoFitRowLimit);
            if (ws.Column(col).Width < MinColumnWidth) ws.Column(col).Width = MinColumnWidth;
            if (ws.Column(col).Width > MaxColumnWidth) ws.Column(col).Width = MaxColumnWidth;
        }

        ws.ShowGridLines = false;

        if (freezeRow > 0)
            ws.SheetView.FreezeRows(freezeRow);

        if (filterHeaderRow > 0 && filterLastRow >= filterHeaderRow)
            ws.Range(filterHeaderRow, 1, filterLastRow, colCount).SetAutoFilter();

        ApplyPrintSetup(ws.PageSetup, repeatTop);
    }

    public static byte[] SaveWorkbook(XLWorkbook workbook)
    {
        using MemoryStream ms = new();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }

    private static void ApplyPrintSetup(IXLPageSetup ps, int repeatTop)
    {
        ps.PageOrientation = XLPageOrientation.Landscape;
        ps.PaperSize = XLPaperSize.A4Paper;
        ps.PagesWide = 1;
        ps.PagesTall = 0;
        ps.Margins.Top = 0.6;
        ps.Margins.Bottom = 0.6;
        ps.Margins.Left = 0.5;
        ps.Margins.Right = 0.5;
        ps.CenterHorizontally = true;

        if (repeatTop > 0)
            ps.SetRowsToRepeatAtTop(1, repeatTop);

        ps.Footer.Left.AddText("Sentinel");
        ps.Footer.Right.AddText("Page ");
        ps.Footer.Right.AddText(XLHFPredefinedText.PageNumber);
        ps.Footer.Right.AddText(" / ");
        ps.Footer.Right.AddText(XLHFPredefinedText.NumberOfPages);
    }

    public static void SetRowBackground(IXLWorksheet ws, int row, int colCount, XLColor color, bool autoHeight = false)
    {
        ws.Range(row, 1, row, colCount).Style.Fill.BackgroundColor = color;
        if (!autoHeight)
            ws.Row(row).Height = 18;
    }

    public static void ApplyDataBlockStyle(IXLWorksheet ws, int firstRow, int lastRow, int colCount,
        bool autoHeight = false)
    {
        if (lastRow < firstRow) return;

        IXLRange range = ws.Range(firstRow, 1, lastRow, colCount);
        range.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        range.Style.Border.OutsideBorderColor = BorderColor;
        range.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
        range.Style.Border.InsideBorderColor = BorderColor;
        range.Style.Alignment.Vertical = autoHeight ? XLAlignmentVerticalValues.Top : XLAlignmentVerticalValues.Center;
    }

    public static void ApplyTotalsRow(IXLWorksheet ws, int row, int colCount)
    {
        IXLRange range = ws.Range(row, 1, row, colCount);
        range.Style.Fill.BackgroundColor = TotalBg;
        range.Style.Font.FontColor = TotalFg;
        range.Style.Font.Bold = true;
        range.Style.Border.TopBorder = XLBorderStyleValues.Medium;
        range.Style.Border.TopBorderColor = BrandIndigo;
        range.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        range.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        ws.Row(row).Height = 20;
        ws.Cell(row, 1).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
        ws.Cell(row, 1).Style.Alignment.Indent = 1;
    }

    public static void SetDateCell(IXLCell cell, DateTime dt, string format)
    {
        cell.Value = dt;
        cell.Style.NumberFormat.Format = format;
    }

    public static void ApplyStatusCell(IXLCell cell, string value, XLColor fg)
    {
        cell.Value = value;
        cell.Style.Font.FontColor = fg;
        cell.Style.Font.Bold = true;
        cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
    }

    public static void SetCountCell(IXLCell cell, int value, XLColor? alertColor = null)
    {
        cell.Value = value;
        cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        if (alertColor == null || value <= 0) return;

        cell.Style.Font.FontColor = alertColor;
        cell.Style.Font.Bold = true;
    }

    public static void SetPlaceholderCell(IXLCell cell)
    {
        cell.Value = "—";
        cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        cell.Style.Font.FontColor = GrayFg;
    }
}
