using Sentinel.Domain.Entities;

namespace Sentinel.Application.Scanning;

public record FindingTicketSyncResult(IReadOnlyList<Ticket> LinkedTickets, bool TicketsChanged);
