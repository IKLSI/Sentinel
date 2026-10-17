using Sentinel.Domain.Entities;

namespace Sentinel.Application.TechHealth.Scan;

public record FindingTicketSyncResult(IReadOnlyList<Ticket> LinkedTickets, bool TicketsChanged);
