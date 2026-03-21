using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Sentinel.Infrastructure.Data;
using Sentinel.Domain.DTOs.Invoices;
using Sentinel.Domain.Models;

namespace Sentinel.Application.Services;

public class InvoiceService
{
    private readonly SentinelContext _context;
    private readonly TimeTrackingService _timeTrackingService;
    private readonly ILogger<InvoiceService> _logger;

    public InvoiceService(
        SentinelContext context,
        TimeTrackingService timeTrackingService,
        ILogger<InvoiceService> logger)
    {
        _context = context;
        _timeTrackingService = timeTrackingService;
        _logger = logger;
    }

    public async Task<Invoice> GenerateInvoiceAsync(GenerateInvoiceDto dto)
    {
        Guid organizationId = dto.OrganizationId;

        if (dto.TechProjectId.HasValue)
        {
            TechProject project = await _context.TechProjects.FindAsync(dto.TechProjectId.Value)
                ?? throw new InvalidOperationException("Projet introuvable");
            organizationId = project.OrganizationId;
        }

        decimal totalHours = await _timeTrackingService.GetTotalHoursForPeriodAsync(dto.Period, dto.TechProjectId);
        decimal totalAmount = Math.Round(totalHours * (dto.DailyRate / 8m), 2);

        DateTime now = DateTime.UtcNow;
        int invoiceNumber = await _context.Invoices.CountAsync(i => i.IssuedAt.Year == now.Year) + 1;

        Invoice invoice = new Invoice
        {
            OrganizationId = organizationId,
            TechProjectId = dto.TechProjectId,
            Label = dto.Label,
            DailyRate = dto.DailyRate,
            Period = dto.Period,
            InvoiceNumber = invoiceNumber,
            TotalHours = totalHours,
            TotalAmount = totalAmount,
            TaxRate = dto.TaxRate,
            Status = InvoiceStatus.Draft,
            IssuedAt = now,
            DueAt = now.AddDays(dto.DueDays > 0 ? dto.DueDays : 30)
        };

        await _context.Invoices.AddAsync(invoice);
        await _context.SaveChangesAsync();

        invoice.PdfData = await GeneratePdfAsync(invoice);
        await _context.SaveChangesAsync();

        return invoice;
    }

    public async Task<Invoice?> UpdateStatusAsync(Guid invoiceId, InvoiceStatus newStatus)
    {
        Invoice? invoice = await _context.Invoices.FindAsync(invoiceId);
        if (invoice == null)
        {
            return null;
        }

        invoice.Status = newStatus;
        if (newStatus == InvoiceStatus.Paid)
        {
            invoice.PaidAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return invoice;
    }

    public async Task<byte[]> GeneratePdfAsync(Invoice invoice)
    {
        if (invoice.PdfData is { Length: > 0 })
            return invoice.PdfData;

        QuestPDF.Settings.License = LicenseType.Community;

        string? projectName = null;
        if (invoice.TechProjectId.HasValue)
        {
            projectName = await _context.TechProjects
                .Where(p => p.Id == invoice.TechProjectId.Value)
                .Select(p => p.Name)
                .FirstOrDefaultAsync();
        }

        DateTime now = invoice.IssuedAt;
        int num = invoice.InvoiceNumber > 0 ? invoice.InvoiceNumber : 1;
        string reference = $"FAC-{now.Year}-{num:D3}";
        decimal rate = invoice.DailyRate / 8m;
        decimal taxAmount = Math.Round(invoice.TotalAmount * invoice.TaxRate / 100, 2);
        decimal totalWithTax = invoice.TotalAmount + taxAmount;

        string accentColor = "#4f46e5";
        string accentDark = "#3730a3";
        string textDark = "#111827";
        string textMuted = "#6b7280";
        string bgLight = "#f9fafb";
        string borderColor = "#e5e7eb";

        IDocument pdfDocument = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.MarginHorizontal(1.8f, Unit.Centimetre);
                page.MarginVertical(1.5f, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(10).FontColor(textDark));

                page.Header().Column(header =>
                {
                    header.Item().Height(4).Background(accentColor);

                    header.Item().PaddingTop(16).PaddingBottom(16).Row(row =>
                    {
                        row.RelativeItem().Column(col =>
                        {
                            col.Item().Text("Sentinel")
                                .Bold().FontSize(22).FontColor(accentColor);
                            col.Item().Text("Gestion & Maintenance Applicative")
                                .FontSize(9).FontColor(textMuted);
                            col.Item().PaddingTop(10).Column(addr =>
                            {
                                addr.Item().Text("Sentinel SAS").Bold().FontSize(9);
                                addr.Item().Text("contact@sentinel.io").FontSize(9).FontColor(textMuted);
                            });
                        });

                        row.ConstantItem(180).Column(col =>
                        {
                            col.Item().Background(accentColor).Padding(14).Column(inner =>
                            {
                                inner.Item().Text("FACTURE")
                                    .Bold().FontSize(18).FontColor(Colors.White);
                                inner.Item().PaddingTop(6).Text(reference)
                                    .FontSize(11).FontColor(Colors.White).SemiBold();
                                inner.Item().PaddingTop(10).Text(text =>
                                {
                                    text.Span("Émise le  ").FontSize(8).FontColor("#c7d2fe");
                                    text.Span(invoice.IssuedAt.ToString("dd/MM/yyyy"))
                                        .FontSize(8).FontColor(Colors.White).SemiBold();
                                });
                                if (invoice.DueAt.HasValue)
                                {
                                    inner.Item().Text(text =>
                                    {
                                        text.Span("Échéance  ").FontSize(8).FontColor("#c7d2fe");
                                        text.Span(invoice.DueAt.Value.ToString("dd/MM/yyyy"))
                                            .FontSize(8).FontColor(Colors.White).SemiBold();
                                    });
                                }
                                inner.Item().PaddingTop(4).Text(text =>
                                {
                                    text.Span("Période    ").FontSize(8).FontColor("#c7d2fe");
                                    text.Span(invoice.Period)
                                        .FontSize(8).FontColor(Colors.White).SemiBold();
                                });
                            });
                        });
                    });

                    header.Item().Height(1).Background(borderColor);
                });

                page.Content().PaddingTop(24).Column(col =>
                {
                    col.Item().PaddingBottom(24).Row(row =>
                    {
                        row.RelativeItem().Border(1).BorderColor(borderColor)
                            .Background(bgLight).Padding(14).Column(c =>
                        {
                            c.Item().Text("ÉMETTEUR")
                                .FontSize(8).Bold().FontColor(accentColor)
                                .LetterSpacing(0.08f);
                            c.Item().PaddingTop(6).Text("Sentinel SAS").Bold().FontSize(10);
                            c.Item().Text("contact@sentinel.io").FontSize(9).FontColor(textMuted);
                        });
                        row.ConstantItem(16);
                        row.RelativeItem().Border(1).BorderColor(accentColor)
                            .Background("#eef2ff").Padding(14).Column(c =>
                        {
                            c.Item().Text("DESTINATAIRE")
                                .FontSize(8).Bold().FontColor(accentColor)
                                .LetterSpacing(0.08f);
                            c.Item().PaddingTop(6).Text(invoice.Label).Bold().FontSize(10);
                            if (projectName != null)
                            {
                                c.Item().PaddingTop(4).Text(text =>
                                {
                                    text.Span("Projet : ").FontSize(9).FontColor(textMuted);
                                    text.Span(projectName).FontSize(9).FontColor(textDark).SemiBold();
                                });
                            }
                        });
                    });

                    col.Item().PaddingBottom(6).Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(4);
                            columns.RelativeColumn(1.2f);
                            columns.RelativeColumn(1.5f);
                            columns.RelativeColumn(1.5f);
                        });

                        table.Header(header =>
                        {
                            void HeaderCell(string text, bool right = false)
                            {
                                IContainer cell = header.Cell().Background(accentDark)
                                    .PaddingVertical(8).PaddingHorizontal(10);
                                TextBlockDescriptor t = cell.Text(text).FontColor(Colors.White)
                                    .Bold().FontSize(8).LetterSpacing(0.05f);
                                if (right) t.AlignRight();
                            }
                            HeaderCell("Description");
                            HeaderCell("Heures", right: true);
                            HeaderCell("Taux HT (€/h)", right: true);
                            HeaderCell("Montant HT", right: true);
                        });

                        string description = projectName != null
                            ? $"Régie TMA — {projectName} — {invoice.Period}"
                            : $"Régie TMA — {invoice.Period}";

                        table.Cell().BorderBottom(1).BorderColor(borderColor)
                            .PaddingVertical(10).PaddingHorizontal(10)
                            .Column(c =>
                            {
                                c.Item().Text(description).SemiBold().FontSize(10);
                                c.Item().Text($"Taux journalier : {invoice.DailyRate:F2} €/j")
                                    .FontSize(8).FontColor(textMuted);
                            });
                        table.Cell().BorderBottom(1).BorderColor(borderColor)
                            .PaddingVertical(10).PaddingHorizontal(10)
                            .AlignRight().Text($"{invoice.TotalHours:F2} h").FontSize(10);
                        table.Cell().BorderBottom(1).BorderColor(borderColor)
                            .PaddingVertical(10).PaddingHorizontal(10)
                            .AlignRight().Text($"{rate:F2} €").FontSize(10);
                        table.Cell().BorderBottom(1).BorderColor(borderColor)
                            .PaddingVertical(10).PaddingHorizontal(10)
                            .AlignRight().Text($"{invoice.TotalAmount:F2} €").FontSize(10).SemiBold();
                    });

                    col.Item().AlignRight().PaddingTop(8).Column(summary =>
                    {
                        void SummaryRow(string label, string value, bool highlight = false)
                        {
                            summary.Item()
                                .Background(highlight ? accentColor : Colors.Transparent)
                                .PaddingVertical(highlight ? 8 : 5)
                                .PaddingHorizontal(10)
                                .Row(row =>
                                {
                                    row.ConstantItem(160)
                                        .Text(label)
                                        .AlignRight()
                                        .FontSize(highlight ? 11 : 10)
                                        .FontColor(highlight ? Colors.White : textMuted)
                                        .SemiBold();
                                    row.ConstantItem(110)
                                        .Text(value)
                                        .AlignRight()
                                        .FontSize(highlight ? 13 : 10)
                                        .FontColor(highlight ? Colors.White : textDark)
                                        .Bold();
                                });
                        }

                        SummaryRow("Sous-total HT :", $"{invoice.TotalAmount:F2} €");
                        SummaryRow($"TVA ({invoice.TaxRate:F0} %) :", $"{taxAmount:F2} €");
                        summary.Item().Height(1).Background(borderColor);
                        SummaryRow("TOTAL TTC :", $"{totalWithTax:F2} €", highlight: true);
                    });

                    col.Item().PaddingTop(28).Border(1).BorderColor(borderColor)
                        .Background(bgLight).Padding(14).Column(c =>
                    {
                        c.Item().Text("CONDITIONS DE PAIEMENT")
                            .FontSize(8).Bold().FontColor(accentColor).LetterSpacing(0.08f);
                        c.Item().PaddingTop(6).Text(text =>
                        {
                            text.Span("Virement bancaire — ").FontSize(9).FontColor(textMuted);
                            text.Span($"Délai : {(invoice.DueAt.HasValue ? $"{(invoice.DueAt.Value - invoice.IssuedAt).Days} jours" : "30 jours")}")
                                .FontSize(9).FontColor(textDark).SemiBold();
                        });
                    });
                });

                page.Footer().Column(footer =>
                {
                    footer.Item().Height(1).Background(borderColor);
                    footer.Item().PaddingTop(8).Row(row =>
                    {
                        row.RelativeItem().Text(text =>
                        {
                            text.Span("Sentinel SAS — contact@sentinel.io").FontSize(8).FontColor(textMuted);
                        });
                        row.RelativeItem().AlignRight().Text(text =>
                        {
                            text.Span("Page ").FontSize(8).FontColor(textMuted);
                            text.CurrentPageNumber().FontSize(8).FontColor(textMuted);
                            text.Span(" / ").FontSize(8).FontColor(textMuted);
                            text.TotalPages().FontSize(8).FontColor(textMuted);
                        });
                    });
                });
            });
        });

        return pdfDocument.GeneratePdf();
    }
}
