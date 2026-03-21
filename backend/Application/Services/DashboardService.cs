using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Sentinel.Infrastructure.Data;
using Sentinel.Domain.DTOs.Dashboard;
using Sentinel.Domain.Models;

namespace Sentinel.Application.Services;

public class DashboardService
{
    private readonly SentinelContext _context;
    private readonly IMemoryCache _cache;

    public DashboardService(SentinelContext context, IMemoryCache cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<DashboardStatsDto> GetStatsAsync(Guid organizationId)
    {
        string cacheKey = $"dashboard:{organizationId}";

        if (_cache.TryGetValue(cacheKey, out DashboardStatsDto? cached) && cached != null)
            return cached;

        DateTime now = DateTime.UtcNow;
        DateTime monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime lastMonthStart = monthStart.AddMonths(-1);
        DateTime lastMonthEnd = monthStart.AddTicks(-1);
        DateTime weekAgo = now.AddDays(-7);
        DateOnly monthStartDate = DateOnly.FromDateTime(monthStart);
        DateOnly todayDate = DateOnly.FromDateTime(now);

        List<Ticket> tickets = await _context.Tickets
            .Include(t => t.Project)
            .Where(t => t.OrganizationId == organizationId)
            .ToListAsync();

        TicketStatus[] openStatuses = new[] { TicketStatus.New, TicketStatus.InProgress, TicketStatus.Testing };
        TicketStatus[] closedStatuses = new[] { TicketStatus.Resolved, TicketStatus.Closed };

        int openTickets = tickets.Count(t => openStatuses.Contains(t.Status));
        int openTicketsDelta = tickets.Count(t => openStatuses.Contains(t.Status) && t.CreatedAt >= weekAgo);

        List<Ticket> closedThisMonth = tickets.Where(t => closedStatuses.Contains(t.Status) && t.UpdatedAt >= monthStart).ToList();
        List<Ticket> closedLastMonth = tickets.Where(t => closedStatuses.Contains(t.Status) && t.UpdatedAt >= lastMonthStart && t.UpdatedAt <= lastMonthEnd).ToList();

        int hoursThisMonth = await _context.TimeEntries
            .Include(te => te.User)
            .Where(te => te.User.OrganizationId == organizationId && te.Date >= monthStartDate && te.Date <= todayDate)
            .SumAsync(te => (int?)te.DurationMinutes) ?? 0;

        List<Invoice> invoices = await _context.Invoices
            .Where(i => i.OrganizationId == organizationId && i.IssuedAt >= monthStart)
            .ToListAsync();

        decimal billableRevenue = invoices
            .Where(i => i.Status == InvoiceStatus.Sent || i.Status == InvoiceStatus.Paid)
            .Sum(i => i.TotalAmount);

        decimal unbilledRevenue = invoices
            .Where(i => i.Status == InvoiceStatus.Draft)
            .Sum(i => i.TotalAmount);

        int criticalVulnerabilities = await _context.Vulnerabilities
            .Include(v => v.Dependency).ThenInclude(d => d.TechProject)
            .Where(v => v.Severity == VulnerabilitySeverity.Critical && v.Dependency.TechProject.OrganizationId == organizationId)
            .CountAsync();

        List<Ticket> closedOrResolvedThisMonth = tickets
            .Where(t => closedStatuses.Contains(t.Status) && t.UpdatedAt >= monthStart)
            .ToList();
        int slaRespectedThisMonth = closedOrResolvedThisMonth.Count(t => !t.SlaBreached);
        int slaRespected = closedOrResolvedThisMonth.Count > 0
            ? (int)Math.Round((double)slaRespectedThisMonth / closedOrResolvedThisMonth.Count * 100)
            : 100;

        List<Ticket> closedOrResolvedLastMonth = tickets
            .Where(t => closedStatuses.Contains(t.Status) && t.UpdatedAt >= lastMonthStart && t.UpdatedAt <= lastMonthEnd)
            .ToList();
        int slaRespectedLastMonthCount = closedOrResolvedLastMonth.Count(t => !t.SlaBreached);
        int slaRespectedLastMonth = closedOrResolvedLastMonth.Count > 0
            ? (int)Math.Round((double)slaRespectedLastMonthCount / closedOrResolvedLastMonth.Count * 100)
            : 100;

        TicketStatus[] allStatuses = new[] { TicketStatus.New, TicketStatus.InProgress, TicketStatus.Testing, TicketStatus.Resolved, TicketStatus.Closed };
        Dictionary<string, int> ticketsByStatus = allStatuses.ToDictionary(s => s.ToString(), s => tickets.Count(t => t.Status == s));

        TicketPriority[] allPriorities = [TicketPriority.Critical, TicketPriority.High, TicketPriority.Medium, TicketPriority.Low];
        Dictionary<string, int> ticketsByPriority = allPriorities.ToDictionary(
            p => p.ToString(),
            p => tickets.Count(t => openStatuses.Contains(t.Status) && t.Priority == p)
        );

        int unassignedOpenTickets = tickets.Count(t => openStatuses.Contains(t.Status) && t.AssignedToId == null);

        List<Invoice> overdueInvoices = await _context.Invoices
            .Where(i => i.OrganizationId == organizationId
                && i.Status == InvoiceStatus.Sent
                && i.DueAt != null
                && i.DueAt < now)
            .ToListAsync();

        List<UrgentTicketDto> urgentTickets = tickets
            .Where(t => openStatuses.Contains(t.Status) && (t.Priority == TicketPriority.Critical || t.Priority == TicketPriority.High))
            .OrderByDescending(t => t.SlaBreached)
            .ThenByDescending(t => t.Priority)
            .ThenBy(t => t.SlaDeadline ?? DateTime.MaxValue)
            .Take(5)
            .Select(t => new UrgentTicketDto
            {
                Id = t.Id.ToString(),
                Reference = $"TKT-{t.Id.ToString()[..6].ToUpper()}",
                Title = t.Title,
                Priority = t.Priority.ToString().ToLower(),
                Type = t.Type.ToString().ToLower(),
                ProjectName = t.Project?.Name,
                SlaBreached = t.SlaBreached,
                SlaDeadline = t.SlaDeadline,
            })
            .ToList();

        List<ActivityItemDto> recentActivity = await BuildRecentActivityAsync(organizationId, now);

        DashboardStatsDto result = new DashboardStatsDto
        {
            OpenTickets = openTickets,
            OpenTicketsDelta = openTicketsDelta,
            ResolvedThisMonth = closedThisMonth.Count,
            ResolvedThisMonthDelta = closedThisMonth.Count - closedLastMonth.Count,
            HoursThisMonth = hoursThisMonth / 60,
            BillableRevenue = billableRevenue,
            UnbilledRevenue = unbilledRevenue,
            CriticalVulnerabilities = criticalVulnerabilities,
            SlaRespected = slaRespected,
            SlaRespectedDelta = slaRespected - slaRespectedLastMonth,
            TicketsByStatus = ticketsByStatus,
            TicketsByPriority = ticketsByPriority,
            UnassignedOpenTickets = unassignedOpenTickets,
            OverdueInvoicesCount = overdueInvoices.Count,
            OverdueInvoicesAmount = overdueInvoices.Sum(i => i.TotalAmount),
            UrgentTickets = urgentTickets,
            RecentActivity = recentActivity,
        };

        _cache.Set(cacheKey, result, TimeSpan.FromMinutes(2));

        return result;
    }

    public async Task<List<ActivityItemDto>> BuildRecentActivityAsync(Guid organizationId, DateTime now)
    {
        DateTime since = now.AddDays(-7);
        List<ActivityItemDto> items = new List<ActivityItemDto>();

        List<Ticket> closedTickets = await _context.Tickets
            .Include(t => t.Project)
            .Where(t => t.OrganizationId == organizationId
                && (t.Status == TicketStatus.Resolved || t.Status == TicketStatus.Closed)
                && t.UpdatedAt >= since)
            .OrderByDescending(t => t.UpdatedAt)
            .Take(3)
            .ToListAsync();

        foreach (Ticket? t in closedTickets)
        {
            string proj = t.Project?.Name is string pn ? $" — {pn}" : "";
            items.Add(new ActivityItemDto
            {
                Color = "accent",
                Text = $"Ticket {(t.Title.Length > 40 ? t.Title[..40] + "…" : t.Title)} résolu{proj}",
                Timestamp = t.UpdatedAt,
                Detail = t.Priority.ToString(),
            });
        }

        List<Vulnerability> recentVulns = await _context.Vulnerabilities
            .Include(v => v.Dependency).ThenInclude(d => d.TechProject)
            .Where(v => v.Severity == VulnerabilitySeverity.Critical
                && v.Dependency.TechProject.OrganizationId == organizationId
                && v.DetectedAt >= since)
            .OrderByDescending(v => v.DetectedAt)
            .Take(2)
            .ToListAsync();

        foreach (Vulnerability? v in recentVulns)
        {
            items.Add(new ActivityItemDto
            {
                Color = "red",
                Text = $"Vuln critique détectée — {v.CveId} sur {v.Dependency.TechProject.Name}",
                Timestamp = v.DetectedAt,
                Detail = "Scanner automatique",
            });
        }

        List<Invoice> recentInvoices = await _context.Invoices
            .Include(i => i.TechProject)
            .Where(i => i.OrganizationId == organizationId
                && (i.Status == InvoiceStatus.Sent || i.Status == InvoiceStatus.Paid)
                && i.IssuedAt >= since)
            .OrderByDescending(i => i.IssuedAt)
            .Take(2)
            .ToListAsync();

        foreach (Invoice? inv in recentInvoices)
        {
            string projectLabel = inv.TechProject?.Name ?? inv.Label;
            items.Add(new ActivityItemDto
            {
                Color = "green",
                Text = $"Facture FAC-{inv.InvoiceNumber:D4} émise — {projectLabel} — {inv.TotalAmount:N0} €",
                Timestamp = inv.IssuedAt,
                Detail = string.Empty,
            });
        }

        return [.. items.OrderByDescending(a => a.Timestamp).Take(5)];
    }
}
