using Microsoft.EntityFrameworkCore;
using Sentinel.Infrastructure.Data;
using Sentinel.Domain.DTOs.Sprints;
using Sentinel.Domain.Models;

namespace Sentinel.Application.Services;

public class SprintService
{
    private readonly SentinelContext _context;

    public SprintService(SentinelContext context)
    {
        _context = context;
    }

    public async Task<List<SprintDto>> GetSprintsAsync(Guid organizationId, Guid? projectId)
    {
        IQueryable<Sprint> query = _context.Sprints
            .Include(s => s.Project)
            .Include(s => s.Tickets)
            .Where(s => s.OrganizationId == organizationId);

        if (projectId.HasValue)
            query = query.Where(s => s.ProjectId == projectId.Value);

        List<Sprint> sprints = await query
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        return sprints.Select(MapToDto).ToList();
    }

    public async Task<SprintDto?> GetSprintAsync(Guid sprintId, Guid organizationId)
    {
        Sprint? sprint = await _context.Sprints
            .Include(s => s.Project)
            .Include(s => s.Tickets)
            .FirstOrDefaultAsync(s => s.Id == sprintId && s.OrganizationId == organizationId);

        return sprint == null ? null : MapToDto(sprint);
    }

    public async Task<Sprint> CreateSprintAsync(CreateSprintDto dto, Guid organizationId)
    {
        bool projectExists = await _context.TechProjects
            .AnyAsync(p => p.Id == dto.ProjectId && p.OrganizationId == organizationId);

        if (!projectExists)
            throw new InvalidOperationException("Projet introuvable");

        Sprint sprint = new Sprint
        {
            OrganizationId = organizationId,
            ProjectId = dto.ProjectId,
            Name = dto.Name,
            Goal = dto.Goal,
            Status = SprintStatus.Planned,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _context.Sprints.AddAsync(sprint);
        await _context.SaveChangesAsync();

        return sprint;
    }

    public async Task<Sprint?> UpdateSprintAsync(Guid sprintId, UpdateSprintDto dto, Guid organizationId)
    {
        Sprint? sprint = await _context.Sprints
            .FirstOrDefaultAsync(s => s.Id == sprintId && s.OrganizationId == organizationId);

        if (sprint == null) return null;

        if (dto.Name != null) sprint.Name = dto.Name;
        if (dto.Goal != null) sprint.Goal = dto.Goal;
        if (dto.StartDate.HasValue) sprint.StartDate = dto.StartDate.Value;
        if (dto.EndDate.HasValue) sprint.EndDate = dto.EndDate.Value;

        if (dto.Status != null)
        {
            Dictionary<string, SprintStatus> statusMap = new(StringComparer.OrdinalIgnoreCase)
            {
                ["planned"] = SprintStatus.Planned,
                ["active"] = SprintStatus.Active,
                ["completed"] = SprintStatus.Completed,
                ["archived"] = SprintStatus.Archived,
            };
            if (statusMap.TryGetValue(dto.Status, out SprintStatus parsedStatus))
                sprint.Status = parsedStatus;
        }

        sprint.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return sprint;
    }

    public async Task<bool> DeleteSprintAsync(Guid sprintId, Guid organizationId)
    {
        Sprint? sprint = await _context.Sprints
            .FirstOrDefaultAsync(s => s.Id == sprintId && s.OrganizationId == organizationId);

        if (sprint == null) return false;

        _context.Sprints.Remove(sprint);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> AssignTicketToSprintAsync(Guid sprintId, Guid ticketId, Guid organizationId)
    {
        Sprint? sprint = await _context.Sprints
            .FirstOrDefaultAsync(s => s.Id == sprintId && s.OrganizationId == organizationId);

        if (sprint == null) return false;

        Ticket? ticket = await _context.Tickets
            .FirstOrDefaultAsync(t => t.Id == ticketId && t.OrganizationId == organizationId);

        if (ticket == null) return false;

        ticket.SprintId = sprintId;
        ticket.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> RemoveTicketFromSprintAsync(Guid sprintId, Guid ticketId, Guid organizationId)
    {
        Ticket? ticket = await _context.Tickets
            .FirstOrDefaultAsync(t => t.Id == ticketId && t.SprintId == sprintId && t.OrganizationId == organizationId);

        if (ticket == null) return false;

        ticket.SprintId = null;
        ticket.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return true;
    }

    public static SprintDto MapToDto(Sprint sprint)
    {
        int completedCount = sprint.Tickets.Count(t =>
            t.Status == TicketStatus.Resolved || t.Status == TicketStatus.Closed);

        return new SprintDto
        {
            Id = sprint.Id,
            ProjectId = sprint.ProjectId,
            ProjectName = sprint.Project?.Name ?? string.Empty,
            Name = sprint.Name,
            Goal = sprint.Goal,
            Status = sprint.Status.ToString().ToLowerInvariant(),
            StartDate = sprint.StartDate,
            EndDate = sprint.EndDate,
            TicketCount = sprint.Tickets.Count,
            CompletedCount = completedCount,
            CreatedAt = sprint.CreatedAt
        };
    }
}
