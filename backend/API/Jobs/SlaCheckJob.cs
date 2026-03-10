using Microsoft.EntityFrameworkCore;
using TMAflow.Infrastructure.Data;
using TMAflow.Domain.Models;
using TMAflow.Application.Services;

namespace TMAflow.API.Jobs;

public class SlaCheckJob
{
    private readonly TMAflowContext _context;
    private readonly SlaService _slaService;
    private readonly NotificationService _notificationService;
    private readonly EmailService _emailService;
    private readonly ILogger<SlaCheckJob> _logger;

    public SlaCheckJob(
        TMAflowContext context,
        SlaService slaService,
        NotificationService notificationService,
        EmailService emailService,
        ILogger<SlaCheckJob> logger)
    {
        _context = context;
        _slaService = slaService;
        _notificationService = notificationService;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        _logger.LogInformation("Vérification SLA démarrée");

        await CheckBreachingTicketsAsync();
        await MarkBreachedTicketsAsync();

        _logger.LogInformation("Vérification SLA terminée");
    }

    private async Task CheckBreachingTicketsAsync()
    {
        List<Ticket> breachingSoon = await _slaService.GetBreachingTicketsAsync(withinMinutes: 60);

        foreach (Ticket ticket in breachingSoon)
        {
            if (ticket.SlaWarningNotifiedAt.HasValue && ticket.SlaWarningNotifiedAt.Value > DateTime.UtcNow.AddHours(-1))
                continue;

            List<User> managers = await _context.Users
                .Where(u => u.OrganizationId == ticket.OrganizationId
                    && u.IsActive
                    && (u.Role == UserRole.Admin || u.Role == UserRole.Manager))
                .ToListAsync();

            foreach (User? manager in managers)
            {
                await _notificationService.NotifyUserAsync(
                    manager.Id,
                    "sla_warning",
                    "Alerte SLA imminente",
                    $"Le ticket '{ticket.Title}' va dépasser son SLA dans moins d'une heure (échéance : {ticket.SlaDeadline:dd/MM/yyyy HH:mm})",
                    "Ticket",
                    ticket.Id);

                try
                {
                    await _emailService.SendSlaBreachAlertAsync(
                        manager.Email,
                        manager.FullName,
                        ticket.Title,
                        ticket.SlaDeadline!.Value);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Impossible d'envoyer l'email d'alerte SLA à {Email}", manager.Email);
                }
            }

            if (ticket.AssignedToId.HasValue)
            {
                await _notificationService.NotifyUserAsync(
                    ticket.AssignedToId.Value,
                    "sla_warning",
                    "Alerte SLA imminente",
                    $"Le ticket qui vous est assigné '{ticket.Title}' va dépasser son SLA dans moins d'une heure",
                    "Ticket",
                    ticket.Id);
            }

            ticket.SlaWarningNotifiedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    private async Task MarkBreachedTicketsAsync()
    {
        List<Ticket> breachedTickets = await _slaService.GetBreachedTicketsAsync();

        foreach (Ticket ticket in breachedTickets)
        {
            ticket.SlaBreached = true;
            ticket.UpdatedAt = DateTime.UtcNow;

            List<User> managers = await _context.Users
                .Where(u => u.OrganizationId == ticket.OrganizationId
                    && u.IsActive
                    && (u.Role == UserRole.Admin || u.Role == UserRole.Manager))
                .ToListAsync();

            foreach (User? manager in managers)
            {
                await _notificationService.NotifyUserAsync(
                    manager.Id,
                    "sla_breach",
                    "SLA dépassé",
                    $"Le ticket '{ticket.Title}' a dépassé son SLA. Échéance était : {ticket.SlaDeadline:dd/MM/yyyy HH:mm}",
                    "Ticket",
                    ticket.Id);
            }

            _logger.LogWarning("SLA dépassé pour le ticket {TicketId} - {Title}", ticket.Id, ticket.Title);
        }

        if (breachedTickets.Count > 0)
        {
            await _context.SaveChangesAsync();
        }
    }
}
