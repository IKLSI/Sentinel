namespace Sentinel.Application.Tickets;

public static class TicketReference
{
    private const int NumberDigits = 6;

    public static string For(int number) => $"TKT-{number.ToString().PadLeft(NumberDigits, '0')}";
}
