using Microsoft.EntityFrameworkCore;
using Sentinel.Infrastructure.Data;
using Sentinel.Domain.DTOs.TimeEntries;
using Sentinel.Domain.Models;

namespace Sentinel.Application.Services;

public class TimeTrackingService
{
    private readonly SentinelContext _context;

    public TimeTrackingService(SentinelContext context)
    {
        _context = context;
    }

    public async Task<TimeEntry> CreateManualEntryAsync(CreateTimeEntryDto dto, Guid userId, Guid organizationId)
    {
        await EnsureBelongsToOrganizationAsync(dto.TicketId, dto.ProjectId, organizationId);

        int durationMinutes = dto.DurationMinutes;
        if (dto.StartTime.HasValue && dto.EndTime.HasValue && dto.EndTime > dto.StartTime)
            durationMinutes = (int)(dto.EndTime.Value.ToTimeSpan() - dto.StartTime.Value.ToTimeSpan()).TotalMinutes;

        TimeEntry entry = new TimeEntry
        {
            TicketId = dto.TicketId,
            ProjectId = dto.ProjectId,
            UserId = userId,
            Date = dto.Date,
            DurationMinutes = durationMinutes,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            Title = dto.Title,
            Description = dto.Description
        };

        await _context.TimeEntries.AddAsync(entry);
        await _context.SaveChangesAsync();

        return entry;
    }

    public async Task<TimeEntry?> UpdateEntryAsync(Guid id, UpdateTimeEntryDto dto, Guid userId, Guid organizationId, bool isAdmin = false)
    {
        TimeEntry? entry = await _context.TimeEntries
            .Include(e => e.User)
            .Include(e => e.Ticket)
            .Include(e => e.Project)
            .FirstOrDefaultAsync(e => e.Id == id
                && e.User.OrganizationId == organizationId
                && (isAdmin || e.UserId == userId));

        if (entry == null) return null;

        Guid? newTicketId = dto.TicketId != null && dto.TicketId != Guid.Empty ? dto.TicketId : entry.TicketId;
        Guid? newProjectId = dto.ProjectId != null && dto.ProjectId != Guid.Empty ? dto.ProjectId : entry.ProjectId;
        await EnsureBelongsToOrganizationAsync(newTicketId, newProjectId, organizationId);

        if (dto.Date.HasValue) entry.Date = dto.Date.Value;
        if (dto.DurationMinutes.HasValue) entry.DurationMinutes = dto.DurationMinutes.Value;
        if (dto.StartTime.HasValue) entry.StartTime = dto.StartTime;
        if (dto.EndTime.HasValue) entry.EndTime = dto.EndTime;
        if (dto.StartTime.HasValue && dto.EndTime.HasValue && dto.EndTime > dto.StartTime)
            entry.DurationMinutes = (int)(dto.EndTime.Value.ToTimeSpan() - dto.StartTime.Value.ToTimeSpan()).TotalMinutes;
        if (dto.Title != null) entry.Title = dto.Title;
        if (dto.Description != null) entry.Description = dto.Description;
        if (dto.ProjectId != null) entry.ProjectId = dto.ProjectId == Guid.Empty ? null : dto.ProjectId;
        if (dto.TicketId != null) entry.TicketId = dto.TicketId == Guid.Empty ? null : dto.TicketId;

        await _context.SaveChangesAsync();
        return entry;
    }

    private async Task EnsureBelongsToOrganizationAsync(Guid? ticketId, Guid? projectId, Guid organizationId)
    {
        if (ticketId.HasValue && ticketId.Value != Guid.Empty)
        {
            bool ok = await _context.Tickets
                .AnyAsync(t => t.Id == ticketId.Value && t.OrganizationId == organizationId);
            if (!ok) throw new InvalidOperationException("Ticket invalide");
        }

        if (projectId.HasValue && projectId.Value != Guid.Empty)
        {
            bool ok = await _context.Projects
                .AnyAsync(p => p.Id == projectId.Value && p.OrganizationId == organizationId);
            if (!ok) throw new InvalidOperationException("Projet invalide");
        }
    }

    public async Task<bool> DeleteEntryAsync(Guid id, Guid userId, Guid organizationId, bool isAdmin = false)
    {
        TimeEntry? entry = await _context.TimeEntries
            .Include(e => e.User)
            .FirstOrDefaultAsync(e => e.Id == id
                && e.User.OrganizationId == organizationId
                && (isAdmin || e.UserId == userId));

        if (entry == null) return false;

        _context.TimeEntries.Remove(entry);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<TimeEntryDto>> GetEntriesAsync(Guid organizationId, Guid? userId = null,
        DateOnly? from = null, DateOnly? to = null)
    {
        IQueryable<TimeEntry> query = _context.TimeEntries
            .AsNoTracking()
            .Include(te => te.User)
            .Include(te => te.Ticket)
            .Include(te => te.Project)
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

    public static TimeEntryDto MapToDto(TimeEntry entry)
    {
        return new TimeEntryDto
        {
            Id = entry.Id,
            TicketId = entry.TicketId,
            TicketTitle = entry.Ticket?.Title,
            ProjectId = entry.ProjectId,
            ProjectName = entry.Project?.Name,
            UserId = entry.UserId,
            UserName = entry.User?.FullName ?? string.Empty,
            UserRole = entry.User?.Role.ToString() ?? string.Empty,
            Date = entry.Date,
            DurationMinutes = entry.DurationMinutes,
            StartTime = entry.StartTime,
            EndTime = entry.EndTime,
            Title = entry.Title,
            Description = entry.Description
        };
    }

}
