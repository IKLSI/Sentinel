using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Models;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Application.Services;

public class ExportService
{
    private readonly SentinelContext _context;

    private static readonly XLColor NavyBlue = XLColor.FromHtml("#1B3A6B");
    private static readonly XLColor HeaderBlue = XLColor.FromHtml("#2E6DA4");
    private static readonly XLColor AltRowColor = XLColor.FromHtml("#EBF3FB");
    private static readonly XLColor BorderColor = XLColor.FromHtml("#CCCCCC");
    private static readonly XLColor GreenBg = XLColor.FromHtml("#D5F5E3");
    private static readonly XLColor GreenFg = XLColor.FromHtml("#1E8449");
    private static readonly XLColor GrayBg = XLColor.FromHtml("#F2F3F4");
    private static readonly XLColor GrayFg = XLColor.FromHtml("#5D6D7E");
    private static readonly XLColor OrangeBg = XLColor.FromHtml("#FEF9E7");
    private static readonly XLColor OrangeFg = XLColor.FromHtml("#D68910");
    private static readonly XLColor YellowBg = XLColor.FromHtml("#FFF8E1");
    private static readonly XLColor YellowFg = XLColor.FromHtml("#F57F17");
    private static readonly XLColor RedBg = XLColor.FromHtml("#FDEDEC");
    private static readonly XLColor RedFg = XLColor.FromHtml("#C0392B");

    public ExportService(SentinelContext context)
    {
        _context = context;
    }

    public async Task<byte[]> ExportInvoicesExcelAsync(Guid organizationId, string? status, string? period)
    {
        IQueryable<Invoice> query = _context.Invoices
            .Include(i => i.TechProject)
            .Where(i => i.OrganizationId == organizationId);

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<InvoiceStatus>(status, true, out InvoiceStatus parsedStatus))
            query = query.Where(i => i.Status == parsedStatus);

        if (!string.IsNullOrEmpty(period))
            query = query.Where(i => i.Period == period);

        List<Invoice> invoices = await query.OrderByDescending(i => i.IssuedAt).ToListAsync();
        return WriteInvoicesExcel(invoices);
    }

    public async Task<byte[]> ExportTimeEntriesExcelAsync(Guid organizationId, Guid? userId, DateOnly? from, DateOnly? to)
    {
        IQueryable<TimeEntry> query = _context.TimeEntries
            .Include(te => te.User)
            .Include(te => te.Ticket)
            .Include(te => te.TechProject)
            .Where(te => te.User.OrganizationId == organizationId);

        if (userId.HasValue)
            query = query.Where(te => te.UserId == userId.Value);

        if (from.HasValue)
            query = query.Where(te => te.Date >= from.Value);

        if (to.HasValue)
            query = query.Where(te => te.Date <= to.Value);

        List<TimeEntry> entries = await query.OrderByDescending(te => te.Date).ToListAsync();
        return WriteTimeEntriesExcel(entries);
    }

    public async Task<byte[]> ExportTicketsExcelAsync(
        Guid organizationId, string? status, string? priority, Guid? assignedTo, string? type, bool? slaBreached, string? search)
    {
        IQueryable<Ticket> query = _context.Tickets
            .Include(t => t.Project)
            .Include(t => t.AssignedTo)
            .Include(t => t.CreatedBy)
            .Include(t => t.TimeEntries)
            .Where(t => t.OrganizationId == organizationId);

        if (!string.IsNullOrEmpty(priority) && Enum.TryParse<TicketPriority>(priority, true, out TicketPriority parsedPriority))
            query = query.Where(t => t.Priority == parsedPriority);

        Dictionary<string, TicketStatus> statusMap = new(StringComparer.OrdinalIgnoreCase)
        {
            ["new"] = TicketStatus.New,
            ["in_progress"] = TicketStatus.InProgress,
            ["inprogress"] = TicketStatus.InProgress,
            ["testing"] = TicketStatus.Testing,
            ["resolved"] = TicketStatus.Resolved,
            ["closed"] = TicketStatus.Closed,
        };
        if (!string.IsNullOrEmpty(status) && statusMap.TryGetValue(status, out TicketStatus parsedStatus))
            query = query.Where(t => t.Status == parsedStatus);

        if (assignedTo.HasValue)
            query = query.Where(t => t.AssignedToId == assignedTo.Value);

        if (!string.IsNullOrEmpty(type) && Enum.TryParse<TicketType>(type, true, out TicketType parsedType))
            query = query.Where(t => t.Type == parsedType);

        if (slaBreached.HasValue)
            query = query.Where(t => t.SlaBreached == slaBreached.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            string pattern = $"%{search}%";
            query = query.Where(t =>
                EF.Functions.ILike(t.Title, pattern) ||
                EF.Functions.ILike(t.Description, pattern));
        }

        List<Ticket> tickets = await query.OrderByDescending(t => t.CreatedAt).ToListAsync();
        return WriteTicketsExcel(tickets);
    }

    private static byte[] WriteInvoicesExcel(List<Invoice> invoices)
    {
        string[] headers = ["Numéro", "Période", "Client", "Projet", "Heures", "TJM", "Montant HT", "TVA %", "Montant TTC", "Statut", "Émise le", "Échéance", "Payée le"];

        using XLWorkbook workbook = new();
        IXLWorksheet ws = workbook.Worksheets.Add("Factures");

        ApplyTitle(ws, $"SENTINEL — Export Factures — {DateTime.Now:dd/MM/yyyy}", headers.Length);
        ApplyHeaders(ws, headers);

        for (int i = 0; i < invoices.Count; i++)
        {
            Invoice inv = invoices[i];
            int row = i + 3;

            SetRowBackground(ws, row, headers.Length, i % 2 == 1 ? AltRowColor : XLColor.White);

            ws.Cell(row, 1).Value = $"FAC-{inv.IssuedAt.Year}-{inv.InvoiceNumber:D3}";
            ws.Cell(row, 2).Value = inv.Period;
            ws.Cell(row, 3).Value = inv.Label;
            ws.Cell(row, 4).Value = inv.TechProject?.Name ?? string.Empty;

            ws.Cell(row, 5).Value = (double)Math.Round(inv.TotalHours, 2);
            ws.Cell(row, 5).Style.NumberFormat.Format = "0.00 \"h\"";

            ws.Cell(row, 6).Value = (double)inv.DailyRate;
            ws.Cell(row, 6).Style.NumberFormat.Format = "# ##0.00 \"€\"";

            ws.Cell(row, 7).Value = (double)Math.Round(inv.TotalAmount / (1 + inv.TaxRate / 100), 2);
            ws.Cell(row, 7).Style.NumberFormat.Format = "# ##0.00 \"€\"";

            ws.Cell(row, 8).Value = (double)inv.TaxRate;
            ws.Cell(row, 8).Style.NumberFormat.Format = "0.00\\%";

            ws.Cell(row, 9).Value = (double)inv.TotalAmount;
            ws.Cell(row, 9).Style.NumberFormat.Format = "# ##0.00 \"€\"";

            ApplyStatusCell(ws.Cell(row, 10), TranslateInvoiceStatus(inv.Status.ToString()), InvoiceStatusColor);

            SetDateCell(ws.Cell(row, 11), inv.IssuedAt);
            if (inv.DueAt.HasValue) SetDateCell(ws.Cell(row, 12), inv.DueAt.Value);
            if (inv.PaidAt.HasValue) SetDateCell(ws.Cell(row, 13), inv.PaidAt.Value);
        }

        FinalizeSheet(ws, headers.Length);
        return SaveWorkbook(workbook);
    }

    private static byte[] WriteTimeEntriesExcel(List<TimeEntry> entries)
    {
        string[] headers = ["Date", "Utilisateur", "Projet", "Ticket", "Durée", "Commentaire", "Saisie manuelle"];

        using XLWorkbook workbook = new();
        IXLWorksheet ws = workbook.Worksheets.Add("Saisies de temps");

        ApplyTitle(ws, $"SENTINEL — Export Saisies de temps — {DateTime.Now:dd/MM/yyyy}", headers.Length);
        ApplyHeaders(ws, headers);

        for (int i = 0; i < entries.Count; i++)
        {
            TimeEntry te = entries[i];
            int row = i + 3;

            SetRowBackground(ws, row, headers.Length, i % 2 == 1 ? AltRowColor : XLColor.White);

            SetDateCell(ws.Cell(row, 1), te.Date.ToDateTime(TimeOnly.MinValue));
            ws.Cell(row, 2).Value = te.User?.FullName ?? string.Empty;
            ws.Cell(row, 3).Value = te.TechProject?.Name ?? string.Empty;
            ws.Cell(row, 4).Value = te.Ticket?.Title ?? string.Empty;

            ws.Cell(row, 5).Value = (double)Math.Round(te.DurationMinutes / 60m, 2);
            ws.Cell(row, 5).Style.NumberFormat.Format = "0.00 \"h\"";

            ws.Cell(row, 6).Value = te.Comment ?? string.Empty;
            ws.Cell(row, 7).Value = te.IsManual ? "Oui" : "Non";
        }

        FinalizeSheet(ws, headers.Length);
        return SaveWorkbook(workbook);
    }

    private static byte[] WriteTicketsExcel(List<Ticket> tickets)
    {
        string[] headers = ["Référence", "Titre", "Statut", "Priorité", "Type", "Assigné à", "Projet", "Créé par", "Créé le", "Mis à jour le", "Deadline SLA", "SLA dépassée", "H. estimées", "H. saisies"];

        using XLWorkbook workbook = new();
        IXLWorksheet ws = workbook.Worksheets.Add("Tickets");

        ApplyTitle(ws, $"SENTINEL — Export Tickets — {DateTime.Now:dd/MM/yyyy}", headers.Length);
        ApplyHeaders(ws, headers);

        for (int i = 0; i < tickets.Count; i++)
        {
            Ticket t = tickets[i];
            int row = i + 3;

            SetRowBackground(ws, row, headers.Length, i % 2 == 1 ? AltRowColor : XLColor.White);

            ws.Cell(row, 1).Value = $"TKT-{t.Id.ToString().Replace("-", "")[..6].ToUpper()}";
            ws.Cell(row, 2).Value = t.Title;

            ApplyStatusCell(ws.Cell(row, 3), TranslateTicketStatus(t.Status.ToString()), TicketStatusColor);
            ApplyStatusCell(ws.Cell(row, 4), TranslateTicketPriority(t.Priority.ToString()), TicketPriorityColor);

            ws.Cell(row, 5).Value = TranslateTicketType(t.Type.ToString());
            ws.Cell(row, 6).Value = t.AssignedTo?.FullName ?? string.Empty;
            ws.Cell(row, 7).Value = t.Project?.Name ?? string.Empty;
            ws.Cell(row, 8).Value = t.CreatedBy?.FullName ?? string.Empty;

            SetDateCell(ws.Cell(row, 9), t.CreatedAt);
            SetDateCell(ws.Cell(row, 10), t.UpdatedAt);

            if (t.SlaDeadline.HasValue)
            {
                ws.Cell(row, 11).Value = t.SlaDeadline.Value;
                ws.Cell(row, 11).Style.NumberFormat.Format = "dd/mm/yyyy hh:mm";
            }

            IXLCell slaCell = ws.Cell(row, 12);
            slaCell.Value = t.SlaBreached ? "Oui" : "Non";
            slaCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            if (t.SlaBreached)
            {
                slaCell.Style.Fill.BackgroundColor = RedBg;
                slaCell.Style.Font.FontColor = RedFg;
                slaCell.Style.Font.Bold = true;
            }

            if (t.EstimatedHours.HasValue)
            {
                ws.Cell(row, 13).Value = (double)t.EstimatedHours.Value;
                ws.Cell(row, 13).Style.NumberFormat.Format = "0.00 \"h\"";
            }

            ws.Cell(row, 14).Value = (double)Math.Round(t.TimeEntries.Sum(te => te.DurationMinutes) / 60m, 2);
            ws.Cell(row, 14).Style.NumberFormat.Format = "0.00 \"h\"";
        }

        FinalizeSheet(ws, headers.Length);
        return SaveWorkbook(workbook);
    }

    private static void ApplyTitle(IXLWorksheet ws, string title, int colCount)
    {
        ws.Range(1, 1, 1, colCount).Merge();
        IXLCell cell = ws.Cell(1, 1);
        cell.Value = title;
        cell.Style.Fill.BackgroundColor = NavyBlue;
        cell.Style.Font.FontColor = XLColor.White;
        cell.Style.Font.Bold = true;
        cell.Style.Font.FontSize = 13;
        cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        ws.Row(1).Height = 26;
    }

    private static void ApplyHeaders(IXLWorksheet ws, string[] headers)
    {
        for (int col = 1; col <= headers.Length; col++)
        {
            IXLCell cell = ws.Cell(2, col);
            cell.Value = headers[col - 1];
            cell.Style.Fill.BackgroundColor = HeaderBlue;
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Font.Bold = true;
            cell.Style.Font.FontSize = 11;
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            cell.Style.Border.BottomBorder = XLBorderStyleValues.Medium;
            cell.Style.Border.BottomBorderColor = XLColor.FromHtml("#1565A0");
        }
        ws.Row(2).Height = 22;
    }

    private static void SetRowBackground(IXLWorksheet ws, int row, int colCount, XLColor color)
    {
        IXLRange range = ws.Range(row, 1, row, colCount);
        range.Style.Fill.BackgroundColor = color;
        range.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        range.Style.Border.OutsideBorderColor = BorderColor;
        range.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
        range.Style.Border.InsideBorderColor = BorderColor;
        range.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        ws.Row(row).Height = 18;
    }

    private static void SetDateCell(IXLCell cell, DateTime dt)
    {
        cell.Value = dt;
        cell.Style.NumberFormat.Format = "dd/mm/yyyy";
    }

    private static void ApplyStatusCell(IXLCell cell, string value, Func<string, (XLColor bg, XLColor fg)> colorFn)
    {
        cell.Value = value;
        (XLColor bg, XLColor fg) = colorFn(value);
        cell.Style.Fill.BackgroundColor = bg;
        cell.Style.Font.FontColor = fg;
        cell.Style.Font.Bold = true;
        cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
    }

    private static (XLColor bg, XLColor fg) InvoiceStatusColor(string status) => status switch
    {
        "Payée" => (GreenBg, GreenFg),
        "Envoyée" => (OrangeBg, OrangeFg),
        _ => (GrayBg, GrayFg),
    };

    private static (XLColor bg, XLColor fg) TicketStatusColor(string status) => status switch
    {
        "Résolu" or "Fermé" => (GreenBg, GreenFg),
        "En cours" or "En test" => (OrangeBg, OrangeFg),
        _ => (GrayBg, GrayFg),
    };

    private static (XLColor bg, XLColor fg) TicketPriorityColor(string priority) => priority switch
    {
        "Critique" => (RedBg, RedFg),
        "Élevé" => (OrangeBg, OrangeFg),
        "Moyen" => (YellowBg, YellowFg),
        _ => (GrayBg, GrayFg),
    };

    private static string TranslateInvoiceStatus(string status) => status switch
    {
        "Draft" => "Brouillon",
        "Sent" => "Envoyée",
        "Paid" => "Payée",
        _ => status,
    };

    private static string TranslateTicketStatus(string status) => status switch
    {
        "New" => "Nouveau",
        "InProgress" => "En cours",
        "Testing" => "En test",
        "Resolved" => "Résolu",
        "Closed" => "Fermé",
        _ => status,
    };

    private static string TranslateTicketPriority(string priority) => priority switch
    {
        "Low" => "Faible",
        "Medium" => "Moyen",
        "High" => "Élevé",
        "Critical" => "Critique",
        _ => priority,
    };

    private static string TranslateTicketType(string type) => type switch
    {
        "Feature" => "Fonctionnalité",
        "Security" => "Sécurité",
        _ => type,
    };

    private static void FinalizeSheet(IXLWorksheet ws, int colCount)
    {
        ws.SheetView.FreezeRows(2);
        for (int col = 1; col <= colCount; col++)
        {
            ws.Column(col).AdjustToContents();
            if (ws.Column(col).Width < 12) ws.Column(col).Width = 12;
            if (ws.Column(col).Width > 60) ws.Column(col).Width = 60;
        }
    }

    private static byte[] SaveWorkbook(XLWorkbook workbook)
    {
        using MemoryStream ms = new();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }
}
