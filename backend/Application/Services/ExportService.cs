using System.Globalization;
using System.Text;
using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Models;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Application.Services;

public class ExportService
{
    private readonly SentinelContext _context;

    public ExportService(SentinelContext context)
    {
        _context = context;
    }

    public async Task<byte[]> ExportInvoicesCsvAsync(Guid organizationId, string? status, string? period)
    {
        IQueryable<Invoice> query = _context.Invoices
            .Include(i => i.TechProject)
            .Where(i => i.OrganizationId == organizationId);

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<InvoiceStatus>(status, true, out InvoiceStatus parsedStatus))
            query = query.Where(i => i.Status == parsedStatus);

        if (!string.IsNullOrEmpty(period))
            query = query.Where(i => i.Period == period);

        List<Invoice> invoices = await query.OrderByDescending(i => i.IssuedAt).ToListAsync();

        var rows = invoices.Select(i => new
        {
            Numéro = $"FAC-{i.IssuedAt.Year}-{i.InvoiceNumber:D3}",
            Période = i.Period,
            Client = i.Label,
            Projet = i.TechProject?.Name ?? string.Empty,
            Heures = i.TotalHours,
            TJM = i.DailyRate,
            Montant_HT = Math.Round(i.TotalAmount / (1 + i.TaxRate / 100), 2),
            TVA_pct = i.TaxRate,
            Montant_TTC = i.TotalAmount,
            Statut = i.Status.ToString(),
            Émise_le = i.IssuedAt.ToString("dd/MM/yyyy"),
            Échéance = i.DueAt?.ToString("dd/MM/yyyy") ?? string.Empty,
            Payée_le = i.PaidAt?.ToString("dd/MM/yyyy") ?? string.Empty,
        });

        return WriteCsv(rows);
    }

    public async Task<byte[]> ExportTimeEntriesCsvAsync(Guid organizationId, Guid? userId, DateOnly? from, DateOnly? to)
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

        var rows = entries.Select(te => new
        {
            Date = te.Date.ToString("dd/MM/yyyy"),
            Utilisateur = te.User?.FullName ?? string.Empty,
            Projet = te.TechProject?.Name ?? string.Empty,
            Ticket = te.Ticket?.Title ?? string.Empty,
            Durée_h = Math.Round(te.DurationMinutes / 60m, 2),
            Commentaire = te.Comment ?? string.Empty,
            Saisie_manuelle = te.IsManual ? "Oui" : "Non",
        });

        return WriteCsv(rows);
    }

    public async Task<byte[]> ExportTicketsCsvAsync(
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

        var rows = tickets.Select(t => new
        {
            Référence = $"TKT-{t.Id.ToString().Replace("-", "")[..6].ToUpper()}",
            Titre = t.Title,
            Statut = t.Status.ToString(),
            Priorité = t.Priority.ToString(),
            Type = t.Type.ToString(),
            Assigné_à = t.AssignedTo?.FullName ?? string.Empty,
            Projet = t.Project?.Name ?? string.Empty,
            Créé_par = t.CreatedBy?.FullName ?? string.Empty,
            Créé_le = t.CreatedAt.ToString("dd/MM/yyyy"),
            Mis_à_jour_le = t.UpdatedAt.ToString("dd/MM/yyyy"),
            Deadline_SLA = t.SlaDeadline?.ToString("dd/MM/yyyy HH:mm") ?? string.Empty,
            SLA_dépassée = t.SlaBreached ? "Oui" : "Non",
            Heures_estimées = t.EstimatedHours?.ToString() ?? string.Empty,
            Heures_saisies = Math.Round(t.TimeEntries.Sum(te => te.DurationMinutes) / 60m, 2),
        });

        return WriteCsv(rows);
    }

    private static byte[] WriteCsv<T>(IEnumerable<T> records)
    {
        CsvConfiguration config = new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            Delimiter = ";",
        };

        using MemoryStream ms = new MemoryStream();
        ms.Write(Encoding.UTF8.GetPreamble());
        using StreamWriter writer = new StreamWriter(ms, new UTF8Encoding(false), leaveOpen: true);
        using CsvWriter csv = new CsvWriter(writer, config);
        csv.WriteRecords(records);
        writer.Flush();
        return ms.ToArray();
    }
}
