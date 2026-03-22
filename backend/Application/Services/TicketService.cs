using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;
using Sentinel.Infrastructure.Data;
using Sentinel.Domain.DTOs.Tickets;
using Sentinel.Domain.Models;

namespace Sentinel.Application.Services;

public class TicketService
{
    private readonly SentinelContext _context;
    private readonly SlaService _slaService;
    private readonly IMemoryCache _cache;

    public TicketService(
        SentinelContext context,
        SlaService slaService,
        IMemoryCache cache)
    {
        _context = context;
        _slaService = slaService;
        _cache = cache;
    }

    private void InvalidateDashboardCache(Guid organizationId) =>
        _cache.Remove($"dashboard:{organizationId}");

    public async Task<Ticket> CreateTicketAsync(CreateTicketDto dto, Guid createdById, Guid organizationId)
    {
        DateTime? slaDeadline = await _slaService.CalculateSlaDeadlineAsync(dto.Priority, organizationId);

        Ticket ticket = new Ticket
        {
            OrganizationId = organizationId,
            ProjectId = dto.ProjectId,
            Title = dto.Title,
            Description = dto.Description,
            Priority = dto.Priority,
            Type = dto.Type,
            Status = TicketStatus.New,
            AssignedToId = dto.AssignedToId,
            EstimatedHours = dto.EstimatedHours,
            CreatedById = createdById,
            SlaDeadline = slaDeadline,
            Tags = JsonSerializer.Serialize(dto.Tags),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _context.Tickets.AddAsync(ticket);
        await _context.SaveChangesAsync();
        InvalidateDashboardCache(organizationId);

        return ticket;
    }

    public async Task<Ticket?> UpdateTicketAsync(Guid ticketId, UpdateTicketDto dto, Guid userId)
    {
        Ticket? ticket = await _context.Tickets.FindAsync(ticketId);
        if (ticket == null)
        {
            return null;
        }

        List<TicketHistory> changes = new List<TicketHistory>();

        if (dto.Title != null && dto.Title != ticket.Title)
        {
            changes.Add(CreateHistory(ticketId, userId, "Title", ticket.Title, dto.Title));
            ticket.Title = dto.Title;
        }

        if (dto.Description != null && dto.Description != ticket.Description)
        {
            changes.Add(CreateHistory(ticketId, userId, "Description", ticket.Description, dto.Description));
            ticket.Description = dto.Description;
        }

        if (dto.Priority.HasValue && dto.Priority.Value != ticket.Priority)
        {
            changes.Add(CreateHistory(ticketId, userId, "Priority", ticket.Priority.ToString(), dto.Priority.Value.ToString()));
            ticket.Priority = dto.Priority.Value;
            DateTime? newDeadline = await _slaService.CalculateSlaDeadlineAsync(ticket.Priority, ticket.OrganizationId);
            ticket.SlaDeadline = newDeadline;
        }

        if (dto.Type.HasValue && dto.Type.Value != ticket.Type)
        {
            changes.Add(CreateHistory(ticketId, userId, "Type", ticket.Type.ToString(), dto.Type.Value.ToString()));
            ticket.Type = dto.Type.Value;
        }

        if (dto.AssignedToId != ticket.AssignedToId)
        {
            changes.Add(CreateHistory(ticketId, userId, "AssignedTo",
                ticket.AssignedToId?.ToString(), dto.AssignedToId?.ToString()));
            ticket.AssignedToId = dto.AssignedToId;
        }

        if (dto.EstimatedHours.HasValue && dto.EstimatedHours != ticket.EstimatedHours)
        {
            changes.Add(CreateHistory(ticketId, userId, "EstimatedHours",
                ticket.EstimatedHours?.ToString(), dto.EstimatedHours.Value.ToString()));
            ticket.EstimatedHours = dto.EstimatedHours;
        }

        if (dto.Tags != null)
        {
            string newTagsJson = JsonSerializer.Serialize(dto.Tags);
            changes.Add(CreateHistory(ticketId, userId, "Tags", ticket.Tags, newTagsJson));
            ticket.Tags = newTagsJson;
        }

        ticket.UpdatedAt = DateTime.UtcNow;

        if (changes.Count > 0)
        {
            await _context.TicketHistories.AddRangeAsync(changes);
        }

        await _context.SaveChangesAsync();
        InvalidateDashboardCache(ticket.OrganizationId);

        return ticket;
    }

    public async Task<Ticket?> ChangeStatusAsync(Guid ticketId, TicketStatus newStatus, Guid userId)
    {
        Ticket? ticket = await _context.Tickets.FindAsync(ticketId);
        if (ticket == null)
        {
            return null;
        }

        TicketStatus oldStatus = ticket.Status;
        ticket.Status = newStatus;
        ticket.UpdatedAt = DateTime.UtcNow;

        TicketHistory history = CreateHistory(ticketId, userId, "Status", oldStatus.ToString(), newStatus.ToString());
        await _context.TicketHistories.AddAsync(history);
        await _context.SaveChangesAsync();
        InvalidateDashboardCache(ticket.OrganizationId);

        return ticket;
    }

    public async Task<TicketComment> AddCommentAsync(Guid ticketId, string content, Guid authorId)
    {
        Ticket? ticket = await _context.Tickets.FindAsync(ticketId);
        if (ticket == null)
        {
            throw new InvalidOperationException("Ticket introuvable");
        }

        TicketComment comment = new TicketComment
        {
            TicketId = ticketId,
            AuthorId = authorId,
            Content = content,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _context.TicketComments.AddAsync(comment);
        ticket.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return comment;
    }

    public async Task<TicketDto?> GetTicketWithDetailsAsync(Guid ticketId)
    {
        Ticket? ticket = await _context.Tickets
            .Include(t => t.Project)
            .Include(t => t.AssignedTo)
            .Include(t => t.CreatedBy)
            .Include(t => t.Comments).ThenInclude(c => c.Author)
            .Include(t => t.History).ThenInclude(h => h.User)
            .Include(t => t.TimeEntries)
            .FirstOrDefaultAsync(t => t.Id == ticketId);

        if (ticket == null)
        {
            return null;
        }

        return MapToDto(ticket);
    }

    public static TicketDto MapToDto(Ticket ticket)
    {
        return new TicketDto
        {
            Id = ticket.Id,
            ProjectId = ticket.ProjectId,
            ProjectName = ticket.Project?.Name,
            Title = ticket.Title,
            Description = ticket.Description,
            Priority = ticket.Priority.ToString().ToLower(),
            Type = ticket.Type.ToString().ToLower(),
            Status = ticket.Status switch
            {
                TicketStatus.New => "new",
                TicketStatus.InProgress => "in_progress",
                TicketStatus.Testing => "testing",
                TicketStatus.Resolved => "resolved",
                TicketStatus.Closed => "closed",
                _ => ticket.Status.ToString().ToLower()
            },
            AssignedToId = ticket.AssignedToId,
            AssignedToName = ticket.AssignedTo?.FullName,
            EstimatedHours = ticket.EstimatedHours,
            CreatedById = ticket.CreatedById,
            CreatedByName = ticket.CreatedBy?.FullName ?? string.Empty,
            CreatedAt = ticket.CreatedAt,
            UpdatedAt = ticket.UpdatedAt,
            SlaDeadline = ticket.SlaDeadline,
            SlaBreached = ticket.SlaBreached,
            Tags = ticket.GetTags().ToList(),
            TotalTimeMinutes = ticket.TimeEntries?.Sum(te => te.DurationMinutes) ?? 0,
            Comments = ticket.Comments?.Select(c => new TicketCommentDto
            {
                Id = c.Id,
                AuthorId = c.AuthorId,
                AuthorName = c.Author?.FullName ?? string.Empty,
                Content = c.Content,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            }).OrderBy(c => c.CreatedAt).ToList() ?? new List<TicketCommentDto>(),
            History = ticket.History?.Select(h => new TicketHistoryDto
            {
                Id = h.Id,
                UserId = h.UserId,
                UserName = h.User?.FullName ?? string.Empty,
                Field = h.Field,
                OldValue = h.OldValue,
                NewValue = h.NewValue,
                CreatedAt = h.CreatedAt
            }).OrderByDescending(h => h.CreatedAt).ToList() ?? new List<TicketHistoryDto>()
        };
    }

    private static TicketHistory CreateHistory(Guid ticketId, Guid userId, string field, string? oldValue, string? newValue)
    {
        return new TicketHistory
        {
            TicketId = ticketId,
            UserId = userId,
            Field = field,
            OldValue = oldValue,
            NewValue = newValue,
            CreatedAt = DateTime.UtcNow
        };
    }
}
