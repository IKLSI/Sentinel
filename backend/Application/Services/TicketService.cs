using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using Sentinel.Domain.Constants;
using Sentinel.Infrastructure.Data;
using Sentinel.Domain.DTOs.Tickets;
using Sentinel.Domain.Models;

namespace Sentinel.Application.Services;

public class TicketService
{
    private readonly SentinelContext _context;
    private readonly IMemoryCache _cache;
    private readonly INotificationService _notificationService;
    private readonly ILogger<TicketService> _logger;

    public TicketService(SentinelContext context, IMemoryCache cache, INotificationService notificationService, ILogger<TicketService> logger)
    {
        _context = context;
        _cache = cache;
        _notificationService = notificationService;
        _logger = logger;
    }

    private void InvalidateDashboardCache(Guid organizationId) =>
        _cache.Remove(CacheKeys.Dashboard(organizationId));

    public async Task<Ticket> CreateTicketAsync(CreateTicketDto dto, Guid createdById, Guid organizationId)
    {
        TicketStatus? defaultStatus = await _context.TicketStatuses
            .Where(s => s.OrganizationId == organizationId)
            .OrderBy(s => s.Order)
            .FirstOrDefaultAsync();

        Ticket ticket = new Ticket
        {
            OrganizationId = organizationId,
            ProjectId = dto.ProjectId,
            Title = dto.Title,
            Description = dto.Description,
            Priority = dto.Priority,
            Type = dto.Type,
            TicketStatusId = defaultStatus?.Id,
            AssignedToId = dto.AssignedToId,
            EstimatedHours = dto.EstimatedHours,
            CreatedById = createdById,
            Tags = JsonSerializer.Serialize(dto.Tags),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _context.Tickets.AddAsync(ticket);
        await _context.SaveChangesAsync();
        InvalidateDashboardCache(organizationId);

        if (dto.AssignedToId.HasValue && dto.AssignedToId.Value != createdById)
        {
            try
            {
                await _notificationService.CreateAsync(
                    dto.AssignedToId.Value,
                    organizationId,
                    NotificationType.TicketAssigned,
                    $"Vous avez été assigné au ticket : {dto.Title}",
                    ticket.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Échec création notification d'assignation pour ticket {TicketId}", ticket.Id);
            }
        }

        return ticket;
    }

    public async Task<Ticket?> UpdateTicketAsync(Guid ticketId, UpdateTicketDto dto, Guid userId)
    {
        Ticket? ticket = await _context.Tickets.FindAsync(ticketId);
        if (ticket == null)
            return null;

        List<TicketHistory> changes = new List<TicketHistory>();

        if (dto.Title != null && dto.Title != ticket.Title)
        {
            ticket.Title = dto.Title;
        }

        if (dto.Description != null && dto.Description != ticket.Description)
        {
            ticket.Description = dto.Description;
        }

        if (dto.Priority.HasValue && dto.Priority.Value != ticket.Priority)
        {
            changes.Add(CreateHistory(ticketId, userId, "Priority", ticket.Priority.ToString(), dto.Priority.Value.ToString()));
            ticket.Priority = dto.Priority.Value;
        }

        if (dto.Type.HasValue && dto.Type.Value != ticket.Type)
        {
            changes.Add(CreateHistory(ticketId, userId, "Type", ticket.Type.ToString(), dto.Type.Value.ToString()));
            ticket.Type = dto.Type.Value;
        }

        if (dto.ProjectId != ticket.ProjectId)
        {
            ticket.ProjectId = dto.ProjectId;
        }

        bool assigneeChanged = dto.AssignedToId != ticket.AssignedToId;
        if (assigneeChanged)
        {
            changes.Add(CreateHistory(ticketId, userId, "AssignedTo", ticket.AssignedToId?.ToString(), dto.AssignedToId?.ToString()));
            ticket.AssignedToId = dto.AssignedToId;
        }

        if (dto.EstimatedHours.HasValue && dto.EstimatedHours != ticket.EstimatedHours)
        {
            changes.Add(CreateHistory(ticketId, userId, "EstimatedHours", ticket.EstimatedHours?.ToString(), dto.EstimatedHours.Value.ToString()));
            ticket.EstimatedHours = dto.EstimatedHours;
        }

        if (dto.Tags != null)
        {
            ticket.Tags = JsonSerializer.Serialize(dto.Tags);
        }

        ticket.UpdatedAt = DateTime.UtcNow;

        if (changes.Count > 0)
            await _context.TicketHistories.AddRangeAsync(changes);

        await _context.SaveChangesAsync();
        InvalidateDashboardCache(ticket.OrganizationId);

        if (assigneeChanged && dto.AssignedToId.HasValue && dto.AssignedToId.Value != userId)
        {
            try
            {
                await _notificationService.CreateAsync(
                    dto.AssignedToId.Value,
                    ticket.OrganizationId,
                    NotificationType.TicketAssigned,
                    $"Vous avez été assigné au ticket : {ticket.Title}",
                    ticketId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Échec création notification d'assignation pour ticket {TicketId}", ticketId);
            }
        }

        return ticket;
    }

    public async Task<Ticket?> ChangeStatusAsync(Guid ticketId, Guid newStatusId, Guid userId)
    {
        Ticket? ticket = await _context.Tickets
            .Include(t => t.TicketStatus)
            .FirstOrDefaultAsync(t => t.Id == ticketId);
        if (ticket == null)
            return null;

        TicketStatus? newStatus = await _context.TicketStatuses.FindAsync(newStatusId);
        if (newStatus == null || newStatus.OrganizationId != ticket.OrganizationId)
            return null;

        string oldStatusName = ticket.TicketStatus?.Name ?? "Inconnu";
        ticket.TicketStatusId = newStatusId;
        ticket.UpdatedAt = DateTime.UtcNow;

        TicketHistory history = CreateHistory(ticketId, userId, "Status", oldStatusName, newStatus.Name);
        await _context.TicketHistories.AddAsync(history);
        await _context.SaveChangesAsync();
        InvalidateDashboardCache(ticket.OrganizationId);

        if (ticket.AssignedToId.HasValue && ticket.AssignedToId.Value != userId)
        {
            try
            {
                await _notificationService.CreateAsync(
                    ticket.AssignedToId.Value,
                    ticket.OrganizationId,
                    NotificationType.TicketStatusChanged,
                    $"Statut du ticket « {ticket.Title} » : {oldStatusName} → {newStatus.Name}",
                    ticketId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Échec création notification de changement de statut pour ticket {TicketId}", ticketId);
            }
        }

        return ticket;
    }

    public async Task<bool> DeleteTicketAsync(Guid ticketId, Guid organizationId)
    {
        int rows = await _context.Tickets
            .Where(t => t.Id == ticketId && t.OrganizationId == organizationId)
            .ExecuteDeleteAsync();
        if (rows == 0)
            return false;

        InvalidateDashboardCache(organizationId);
        return true;
    }

    public async Task<TicketComment> AddCommentAsync(Guid ticketId, string content, Guid authorId)
    {
        Ticket? ticket = await _context.Tickets
            .FirstOrDefaultAsync(t => t.Id == ticketId);
        if (ticket == null)
            throw new InvalidOperationException("Ticket introuvable");

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

        if (ticket.AssignedToId.HasValue && ticket.AssignedToId.Value != authorId)
        {
            try
            {
                await _notificationService.CreateAsync(
                    ticket.AssignedToId.Value,
                    ticket.OrganizationId,
                    NotificationType.TicketCommentAdded,
                    $"Nouveau commentaire sur le ticket : {ticket.Title}",
                    ticketId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Échec création notification de commentaire pour ticket {TicketId}", ticketId);
            }
        }

        return comment;
    }

    public async Task<TicketDto?> GetTicketWithDetailsAsync(Guid ticketId)
    {
        Ticket? ticket = await _context.Tickets
            .AsNoTracking()
            .AsSplitQuery()
            .Include(t => t.TicketStatus)
            .Include(t => t.Project)
            .Include(t => t.AssignedTo)
            .Include(t => t.CreatedBy)
            .Include(t => t.Comments).ThenInclude(c => c.Author)
            .Include(t => t.History).ThenInclude(h => h.User)
            .Include(t => t.TimeEntries)
            .FirstOrDefaultAsync(t => t.Id == ticketId);

        if (ticket == null)
            return null;

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
            StatusId = ticket.TicketStatusId?.ToString() ?? string.Empty,
            StatusName = ticket.TicketStatus?.Name ?? string.Empty,
            StatusColor = ticket.TicketStatus?.Color ?? string.Empty,
            StatusIsClosed = ticket.TicketStatus?.IsClosed ?? false,
            AssignedToId = ticket.AssignedToId,
            AssignedToName = ticket.AssignedTo?.FullName,
            EstimatedHours = ticket.EstimatedHours,
            CreatedById = ticket.CreatedById,
            CreatedByName = ticket.CreatedBy?.FullName ?? string.Empty,
            CreatedAt = ticket.CreatedAt,
            UpdatedAt = ticket.UpdatedAt,
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
