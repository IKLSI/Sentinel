using ClosedXML.Excel;
using Sentinel.Application.Tickets;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using static Sentinel.Application.Exports.Excel.ExcelFormatting;

namespace Sentinel.Application.Exports.Excel;

internal static class TicketsWorkbookWriter
{
    public static byte[] Write(List<TicketExportRow> tickets, ExportLabels L, bool truncated)
    {
        string[] headers = L.TicketHeaders;

        using XLWorkbook workbook = new();
        ApplyDocumentProperties(workbook, L.SubjectTickets);
        IXLWorksheet ws = workbook.Worksheets.Add(L.SheetTickets);

        ApplyTitle(ws, L.TitleTickets, headers.Length);
        ApplyMetaRow(ws, headers.Length, BuildMeta(L, $"{tickets.Count} {L.UnitTickets}",
            truncated ? $"{L.ExportTruncated} {ExportLimits.MaxTicketRows}" : null));
        ApplyHeadersAtRow(ws, headers, HeaderRow);

        for (int i = 0; i < tickets.Count; i++)
        {
            int row = i + FirstDataRow;
            SetRowBackground(ws, row, headers.Length, StripeColor(i));
            WriteTicketRow(ws, row, tickets[i], L);
        }

        int lastDataRow = tickets.Count > 0 ? tickets.Count + FirstDataRow - 1 : HeaderRow;
        ApplyDataBlockStyle(ws, FirstDataRow, lastDataRow, headers.Length);

        if (tickets.Count > 0)
        {
            int totalsRow = lastDataRow + 1;
            ApplyTotalsRow(ws, totalsRow, headers.Length);
            ws.Range(totalsRow, 1, totalsRow, headers.Length).Merge();
            ws.Cell(totalsRow, 1).Value = $"{L.TotalWord} — {tickets.Count} {L.UnitTickets}";
        }

        FinalizeSheet(ws, headers.Length, HeaderRow, HeaderRow, lastDataRow, HeaderRow);
        return SaveWorkbook(workbook);
    }

    private static void WriteTicketRow(IXLWorksheet ws, int row, TicketExportRow ticket, ExportLabels L)
    {
        ws.Cell(row, 1).Value = TicketReference.For(ticket.Number);
        ws.Cell(row, 2).Value = ticket.Title;

        ApplyStatusCell(ws.Cell(row, 3), L.Translate(ticket.Status), TicketStatusColor(ticket.Status));
        ApplyStatusCell(ws.Cell(row, 4), L.Translate(ticket.Priority),
            TicketPriorityColor(ticket.Priority));

        ws.Cell(row, 5).Value = L.Translate(ticket.Type);
        ws.Cell(row, 6).Value = PersonName.Format(ticket.AssignedToFirstName, ticket.AssignedToLastName) ?? string.Empty;
        ws.Cell(row, 7).Value = ticket.ProjectName ?? string.Empty;
        ws.Cell(row, 8).Value = PersonName.Format(ticket.CreatedByFirstName, ticket.CreatedByLastName) ?? string.Empty;

        SetDateCell(ws.Cell(row, 9), ticket.CreatedAt, L.DateFormat);
        SetDateCell(ws.Cell(row, 10), ticket.UpdatedAt, L.DateFormat);
    }
}
