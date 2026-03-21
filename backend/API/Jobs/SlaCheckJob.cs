using Microsoft.EntityFrameworkCore;
using Sentinel.Infrastructure.Data;
using Sentinel.Domain.Models;
using Sentinel.Application.Services;

namespace Sentinel.API.Jobs;

public class SlaCheckJob
{
    private readonly SentinelContext _context;
    private readonly SlaService _slaService;
    private readonly ILogger<SlaCheckJob> _logger;

    public SlaCheckJob(
        SentinelContext context,
        SlaService slaService,
        ILogger<SlaCheckJob> logger)
    {
        _context = context;
        _slaService = slaService;
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

            _logger.LogWarning("SLA dépassé pour le ticket {TicketId} - {Title}", ticket.Id, ticket.Title);
        }

        if (breachedTickets.Count > 0)
        {
            await _context.SaveChangesAsync();
        }
    }
}
