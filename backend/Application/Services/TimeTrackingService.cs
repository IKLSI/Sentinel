using Microsoft.EntityFrameworkCore;
using TMAflow.Infrastructure.Data;
using TMAflow.Domain.DTOs.TimeEntries;
using TMAflow.Domain.Models;

namespace TMAflow.Application.Services;

public class TimeTrackingService
{
    private readonly TMAflowContext _context;

    public TimeTrackingService(TMAflowContext context)
    {
        _context = context;
    }

    public async Task<TimeEntry> CreateManualEntryAsync(CreateTimeEntryDto dto, Guid userId)
    {
        TimeEntry entry = new TimeEntry
        {
            TicketId = dto.TicketId,
            TechProjectId = dto.TechProjectId,
            UserId = userId,
            Date = dto.Date,
            DurationMinutes = dto.DurationMinutes,
            Comment = dto.Comment,
            IsManual = true
        };

        await _context.TimeEntries.AddAsync(entry);
        await _context.SaveChangesAsync();

        return entry;
    }

    public async Task<TimeEntry?> UpdateEntryAsync(Guid id, UpdateTimeEntryDto dto, Guid userId)
    {
        TimeEntry? entry = await _context.TimeEntries
            .Include(e => e.User)
            .Include(e => e.Ticket)
            .Include(e => e.TechProject)
            .FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);

        if (entry == null) return null;

        if (dto.Date.HasValue) entry.Date = dto.Date.Value;
        if (dto.DurationMinutes.HasValue) entry.DurationMinutes = dto.DurationMinutes.Value;
        if (dto.Comment != null) entry.Comment = dto.Comment;
        if (dto.TechProjectId != null) entry.TechProjectId = dto.TechProjectId == Guid.Empty ? null : dto.TechProjectId;
        if (dto.TicketId != null) entry.TicketId = dto.TicketId == Guid.Empty ? null : dto.TicketId;

        await _context.SaveChangesAsync();
        return entry;
    }

    public async Task<bool> DeleteEntryAsync(Guid id, Guid userId)
    {
        TimeEntry? entry = await _context.TimeEntries
            .FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);

        if (entry == null) return false;

        _context.TimeEntries.Remove(entry);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<TimeEntryDto>> GetEntriesAsync(Guid organizationId, Guid? userId = null,
        DateOnly? from = null, DateOnly? to = null)
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

        return entries.Select(MapToDto).ToList();
    }

    public async Task<decimal> GetTotalHoursForPeriodAsync(string period, Guid? techProjectId = null)
    {
        if (!TryParsePeriod(period, out int year, out int month))
        {
            return 0;
        }

        DateOnly from = new DateOnly(year, month, 1);
        DateOnly to = from.AddMonths(1).AddDays(-1);

        IQueryable<TimeEntry> query = _context.TimeEntries
            .Where(te => te.Date >= from && te.Date <= to);

        if (techProjectId.HasValue)
            query = query.Where(te => te.TechProjectId == techProjectId.Value);

        int totalMinutes = await query.SumAsync(te => te.DurationMinutes);

        return Math.Round(totalMinutes / 60m, 2);
    }

    public static TimeEntryDto MapToDto(TimeEntry entry)
    {
        return new TimeEntryDto
        {
            Id = entry.Id,
            TicketId = entry.TicketId,
            TicketTitle = entry.Ticket?.Title,
            TechProjectId = entry.TechProjectId,
            TechProjectName = entry.TechProject?.Name,
            UserId = entry.UserId,
            UserName = entry.User?.FullName ?? string.Empty,
            Date = entry.Date,
            DurationMinutes = entry.DurationMinutes,
            Comment = entry.Comment,
            IsManual = entry.IsManual,
            TimerStartedAt = entry.TimerStartedAt
        };
    }

    private static bool TryParsePeriod(string period, out int year, out int month)
    {
        year = 0;
        month = 0;

        if (string.IsNullOrEmpty(period) || period.Length != 7)
            return false;

        string[] parts = period.Split('-');
        if (parts.Length != 2)
            return false;

        return int.TryParse(parts[0], out year) && int.TryParse(parts[1], out month);
    }
}
