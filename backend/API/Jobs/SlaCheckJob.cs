using Microsoft.EntityFrameworkCore;
using TMAflow.Infrastructure.Data;
using TMAflow.Domain.Models;
using TMAflow.Application.Services;

namespace TMAflow.API.Jobs;

public class SlaCheckJob
{
    private readonly TMAflowContext _context;
    private readonly SlaService _slaService;
    private readonly ILogger<SlaCheckJob> _logger;

    public SlaCheckJob(
        TMAflowContext context,
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
