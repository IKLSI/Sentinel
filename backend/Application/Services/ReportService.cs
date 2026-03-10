using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using TMAflow.Infrastructure.Data;
using TMAflow.Domain.DTOs.Reports;
using TMAflow.Domain.Models;

namespace TMAflow.Application.Services;

public class ReportService
{
    private readonly TMAflowContext _context;
    private readonly EmailService _emailService;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<ReportService> _logger;

    public ReportService(
        TMAflowContext context,
        EmailService emailService,
        IWebHostEnvironment environment,
        ILogger<ReportService> logger)
    {
        _context = context;
        _emailService = emailService;
        _environment = environment;
        _logger = logger;
    }

    public async Task<Report> GenerateMonthlyReportAsync(Guid organizationId, GenerateReportRequest dto)
    {
        string period = !string.IsNullOrEmpty(dto.PeriodStart) && dto.PeriodStart.Length >= 7
            ? dto.PeriodStart[..7]
            : string.Empty;

        DateOnly from;
        DateOnly to;

        if (!string.IsNullOrEmpty(dto.PeriodStart) && !string.IsNullOrEmpty(dto.PeriodEnd)
            && DateOnly.TryParse(dto.PeriodStart, out DateOnly parsedFrom)
            && DateOnly.TryParse(dto.PeriodEnd, out DateOnly parsedTo))
        {
            from = parsedFrom;
            to = parsedTo;
        }
        else if (TryParsePeriod(period, out int year, out int month))
        {
            from = new DateOnly(year, month, 1);
            to = from.AddMonths(1).AddDays(-1);
        }
        else
        {
            throw new ArgumentException("Format de période invalide");
        }

        List<Ticket> tickets = await _context.Tickets
            .Include(t => t.AssignedTo)
            .Where(t => t.OrganizationId == organizationId
                && t.CreatedAt >= from.ToDateTime(TimeOnly.MinValue)
                && t.CreatedAt <= to.ToDateTime(TimeOnly.MaxValue))
            .ToListAsync();

        List<TimeEntry> timeEntries = await _context.TimeEntries
            .Include(te => te.User)
            .Where(te => te.User.OrganizationId == organizationId && te.Date >= from && te.Date <= to)
            .ToListAsync();

        byte[] pdfBytes = GenerateReportPdf(period, tickets, timeEntries);

        string pdfDirectory = Path.Combine(_environment.ContentRootPath, "storage", "reports");
        Directory.CreateDirectory(pdfDirectory);
        string pdfPath = Path.Combine(pdfDirectory, $"rapport_{organizationId}_{period}_{Guid.NewGuid()}.pdf");
        await File.WriteAllBytesAsync(pdfPath, pdfBytes);

        Report report = new Report
        {
            OrganizationId = organizationId,
            Period = period,
            ReportType = dto.Type,
            PeriodStart = dto.PeriodStart,
            PeriodEnd = dto.PeriodEnd,
            GeneratedAt = DateTime.UtcNow,
            PdfPath = pdfPath
        };

        await _context.Reports.AddAsync(report);
        await _context.SaveChangesAsync();

        return report;
    }

    public async Task SendReportAsync(Guid reportId, string recipientEmail, string recipientName)
    {
        Report? report = await _context.Reports.FirstOrDefaultAsync(r => r.Id == reportId);

        if (report == null || string.IsNullOrEmpty(report.PdfPath) || !File.Exists(report.PdfPath))
        {
            throw new InvalidOperationException("Rapport introuvable ou PDF manquant");
        }

        byte[] pdfBytes = await File.ReadAllBytesAsync(report.PdfPath);
        await _emailService.SendMonthlyReportAsync(
            recipientEmail,
            recipientName,
            "TMAflow",
            report.Period,
            pdfBytes);

        report.SentAt = DateTime.UtcNow;
        report.EmailSentTo = recipientEmail;
        await _context.SaveChangesAsync();
    }

    public async Task GenerateAndSendAllMonthlyReportsAsync(string period)
    {
        List<Guid> organizationIds = await _context.Organizations
            .Select(o => o.Id)
            .ToListAsync();

        foreach (Guid organizationId in organizationIds)
        {
            try
            {
                await GenerateMonthlyReportAsync(organizationId, new Domain.DTOs.Reports.GenerateReportRequest
                {
                    Type = "monthly",
                    PeriodStart = $"{period}-01",
                    PeriodEnd = DateTime.ParseExact(period, "yyyy-MM", null).AddMonths(1).AddDays(-1).ToString("yyyy-MM-dd")
                });
                _logger.LogInformation("Rapport {Period} généré pour l'organisation {OrganizationId}", period, organizationId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la génération du rapport {Period} pour l'organisation {OrganizationId}", period, organizationId);
            }
        }
    }

    private static byte[] GenerateReportPdf(string period, List<Ticket> tickets, List<TimeEntry> timeEntries)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        int totalMinutes = timeEntries.Sum(te => te.DurationMinutes);
        decimal totalHours = totalMinutes / 60m;
        int resolvedTickets = tickets.Count(t => t.Status == TicketStatus.Resolved || t.Status == TicketStatus.Closed);
        int openTickets = tickets.Count(t => t.Status != TicketStatus.Resolved && t.Status != TicketStatus.Closed);
        int slaBreachedCount = tickets.Count(t => t.SlaBreached);

        IDocument pdfDocument = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header().Column(col =>
                {
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("TMAflow").Bold().FontSize(22);
                            c.Item().Text("Rapport Mensuel TMA").FontSize(13).FontColor(Colors.Grey.Medium);
                        });
                        row.RelativeItem().AlignRight().Column(c =>
                        {
                            c.Item().Text($"Période : {period}").FontSize(12).Bold();
                            c.Item().Text($"Généré le : {DateTime.Now:dd/MM/yyyy}").FontSize(10).FontColor(Colors.Grey.Medium);
                        });
                    });
                    col.Item().PaddingTop(5).LineHorizontal(1).LineColor(Colors.Blue.Darken2);
                });

                page.Content().PaddingTop(15).Column(col =>
                {
                    col.Item().PaddingBottom(10).Text("Résumé de la période").Bold().FontSize(14);

                    col.Item().PaddingBottom(15).Row(row =>
                    {
                        AddSummaryBox(row, "Heures travaillées", $"{totalHours:F1}h", Colors.Blue.Darken2);
                        row.ConstantItem(10);
                        AddSummaryBox(row, "Tickets créés", tickets.Count.ToString(), Colors.Purple.Medium);
                        row.ConstantItem(10);
                        AddSummaryBox(row, "Tickets résolus", resolvedTickets.ToString(), Colors.Green.Darken2);
                        row.ConstantItem(10);
                        AddSummaryBox(row, "Tickets ouverts", openTickets.ToString(), Colors.Orange.Medium);
                    });

                    if (slaBreachedCount > 0)
                    {
                        col.Item().PaddingBottom(10).Background(Colors.Red.Lighten4).Padding(10)
                            .Text($"Attention : {slaBreachedCount} ticket(s) ont dépassé les délais SLA ce mois-ci")
                            .FontColor(Colors.Red.Darken2);
                    }

                    col.Item().PaddingBottom(5).Text("Tickets du mois").Bold().FontSize(13);

                    col.Item().PaddingBottom(15).Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(3);
                            columns.RelativeColumn(1);
                            columns.RelativeColumn(1);
                            columns.RelativeColumn(1);
                        });

                        table.Header(header =>
                        {
                            header.Cell().Background(Colors.Blue.Darken2).Padding(4).Text("Titre").FontColor(Colors.White).Bold();
                            header.Cell().Background(Colors.Blue.Darken2).Padding(4).Text("Type").FontColor(Colors.White).Bold();
                            header.Cell().Background(Colors.Blue.Darken2).Padding(4).Text("Priorité").FontColor(Colors.White).Bold();
                            header.Cell().Background(Colors.Blue.Darken2).Padding(4).Text("Statut").FontColor(Colors.White).Bold();
                        });

                        foreach (Ticket? ticket in tickets.Take(50))
                        {
                            Color bgColor = ticket.SlaBreached ? Colors.Red.Lighten4 : Colors.White;
                            table.Cell().Background(bgColor).Padding(4).Text(ticket.Title.Length > 60 ? ticket.Title[..60] + "..." : ticket.Title);
                            table.Cell().Background(bgColor).Padding(4).Text(ticket.Type.ToString());
                            table.Cell().Background(bgColor).Padding(4).Text(ticket.Priority.ToString());
                            table.Cell().Background(bgColor).Padding(4).Text(ticket.Status.ToString());
                        }
                    });

                    col.Item().PaddingBottom(5).Text("Saisies de temps").Bold().FontSize(13);

                    IEnumerable<(string UserName, int TotalMinutes)> byUser = timeEntries
                        .GroupBy(te => te.UserId)
                        .Select(g => (
                            UserName: g.First().User?.FullName ?? "Inconnu",
                            TotalMinutes: g.Sum(te => te.DurationMinutes)
                        ))
                        .OrderByDescending(x => x.TotalMinutes);

                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(3);
                            columns.RelativeColumn(1);
                        });

                        table.Header(header =>
                        {
                            header.Cell().Background(Colors.Blue.Darken2).Padding(4).Text("Collaborateur").FontColor(Colors.White).Bold();
                            header.Cell().Background(Colors.Blue.Darken2).Padding(4).Text("Heures").FontColor(Colors.White).Bold();
                        });

                        foreach ((string UserName, int TotalMinutes) entry in byUser)
                        {
                            table.Cell().Padding(4).Text(entry.UserName);
                            table.Cell().Padding(4).Text($"{entry.TotalMinutes / 60m:F1}h");
                        }
                    });
                });

                page.Footer().AlignCenter().Text(text =>
                {
                    text.Span("TMAflow - Rapport confidentiel - ").FontSize(8).FontColor(Colors.Grey.Medium);
                    text.CurrentPageNumber().FontSize(8).FontColor(Colors.Grey.Medium);
                    text.Span(" / ").FontSize(8).FontColor(Colors.Grey.Medium);
                    text.TotalPages().FontSize(8).FontColor(Colors.Grey.Medium);
                });
            });
        });

        return pdfDocument.GeneratePdf();
    }

    private static void AddSummaryBox(RowDescriptor row, string label, string value, string color)
    {
        row.RelativeItem().Border(1).BorderColor(color).Padding(10).Column(c =>
        {
            c.Item().Text(value).Bold().FontSize(20).FontColor(color);
            c.Item().Text(label).FontSize(10).FontColor(Colors.Grey.Medium);
        });
    }

    private static bool TryParsePeriod(string period, out int year, out int month)
    {
        year = 0;
        month = 0;
        if (string.IsNullOrEmpty(period) || period.Length != 7) return false;
        string[] parts = period.Split('-');
        if (parts.Length != 2) return false;
        return int.TryParse(parts[0], out year) && int.TryParse(parts[1], out month);
    }
}
