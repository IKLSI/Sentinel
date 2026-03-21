using Microsoft.EntityFrameworkCore;
using Sentinel.Infrastructure.Data;
using Sentinel.Domain.Models;

namespace Sentinel.Application.Services;

public class SlaService
{
    private readonly SentinelContext _context;

    public SlaService(SentinelContext context)
    {
        _context = context;
    }

    public Task<DateTime?> CalculateSlaDeadlineAsync(TicketPriority priority)
    {
        int businessHours = priority switch
        {
            TicketPriority.Critical => 4,
            TicketPriority.High => 8,
            TicketPriority.Medium => 24,
            TicketPriority.Low => 48,
            _ => 24
        };

        DateTime deadline = AddBusinessHours(DateTime.UtcNow, businessHours);
        return Task.FromResult<DateTime?>(deadline);
    }

    private static DateTime AddBusinessHours(DateTime utcStart, int hours)
    {
        TimeZoneInfo parisZone = TimeZoneInfo.FindSystemTimeZoneById("Europe/Paris");
        DateTime current = TimeZoneInfo.ConvertTimeFromUtc(utcStart, parisZone);

        current = MoveToBusinessHoursStart(current);

        int remaining = hours;
        while (remaining > 0)
        {
            if (current.DayOfWeek == DayOfWeek.Saturday)
            {
                current = new DateTime(current.Year, current.Month, current.Day, 9, 0, 0).AddDays(2);
                continue;
            }
            if (current.DayOfWeek == DayOfWeek.Sunday)
            {
                current = new DateTime(current.Year, current.Month, current.Day, 9, 0, 0).AddDays(1);
                continue;
            }

            int hoursLeftToday = 18 - current.Hour;
            if (remaining <= hoursLeftToday)
            {
                current = current.AddHours(remaining);
                remaining = 0;
            }
            else
            {
                remaining -= hoursLeftToday;
                current = new DateTime(current.Year, current.Month, current.Day, 9, 0, 0).AddDays(1);
            }
        }

        return TimeZoneInfo.ConvertTimeToUtc(current, parisZone);
    }

    private static DateTime MoveToBusinessHoursStart(DateTime dt)
    {
        while (dt.DayOfWeek == DayOfWeek.Saturday || dt.DayOfWeek == DayOfWeek.Sunday)
        {
            dt = new DateTime(dt.Year, dt.Month, dt.Day, 9, 0, 0).AddDays(1);
        }

        if (dt.Hour < 9)
            return new DateTime(dt.Year, dt.Month, dt.Day, 9, 0, 0);

        if (dt.Hour >= 18)
            return new DateTime(dt.Year, dt.Month, dt.Day, 9, 0, 0).AddDays(1);

        return dt;
    }

    public async Task<List<Ticket>> GetBreachingTicketsAsync(int withinMinutes = 60)
    {
        DateTime threshold = DateTime.UtcNow.AddMinutes(withinMinutes);

        return await _context.Tickets
            .Include(t => t.AssignedTo)
            .Where(t =>
                !t.SlaBreached
                && t.SlaDeadline.HasValue
                && t.SlaDeadline.Value <= threshold
                && t.Status != TicketStatus.Resolved
                && t.Status != TicketStatus.Closed)
            .ToListAsync();
    }

    public async Task<List<Ticket>> GetBreachedTicketsAsync()
    {
        return await _context.Tickets
            .Where(t =>
                !t.SlaBreached
                && t.SlaDeadline.HasValue
                && t.SlaDeadline.Value < DateTime.UtcNow
                && t.Status != TicketStatus.Resolved
                && t.Status != TicketStatus.Closed)
            .ToListAsync();
    }


}
