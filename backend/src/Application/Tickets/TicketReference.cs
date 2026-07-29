namespace Sentinel.Application.Tickets;

public static class TicketReference
{
    private const int ShortIdLength = 6;

    public static string For(Guid ticketId) => $"TKT-{ticketId.ToString()[..ShortIdLength].ToUpper()}";
}
