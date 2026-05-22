using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using Sentinel.Infrastructure.Data;
using Sentinel.Domain.DTOs.Tickets;
using Sentinel.Domain.Models;

namespace Sentinel.Application.Services;

public class TicketService
{
    private readonly SentinelContext _context;
    private readonly IMemoryCache _cache;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<TicketService> _logger;

    public TicketService(SentinelContext context, IMemoryCache cache, IEmailService emailService, IConfiguration configuration, ILogger<TicketService> logger)
    {
        _context = context;
        _cache = cache;
        _emailService = emailService;
        _configuration = configuration;
        _logger = logger;
    }

    private void InvalidateDashboardCache(Guid organizationId) =>
        _cache.Remove($"dashboard:{organizationId}");

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
            IsInternal = dto.IsInternal,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _context.Tickets.AddAsync(ticket);
        await _context.SaveChangesAsync();
        InvalidateDashboardCache(organizationId);

        await NotifyAdminsIfClientTicketAsync(ticket, createdById, organizationId, "Nouveau ticket", "Description", dto.Description ?? string.Empty);

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
        }

        if (dto.Type.HasValue && dto.Type.Value != ticket.Type)
        {
            changes.Add(CreateHistory(ticketId, userId, "Type", ticket.Type.ToString(), dto.Type.Value.ToString()));
            ticket.Type = dto.Type.Value;
        }

        if (dto.ProjectId != ticket.ProjectId)
        {
            changes.Add(CreateHistory(ticketId, userId, "ProjectId", ticket.ProjectId?.ToString(), dto.ProjectId?.ToString()));
            ticket.ProjectId = dto.ProjectId;
        }

        if (dto.AssignedToId != ticket.AssignedToId)
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
            string newTagsJson = JsonSerializer.Serialize(dto.Tags);
            changes.Add(CreateHistory(ticketId, userId, "Tags", ticket.Tags, newTagsJson));
            ticket.Tags = newTagsJson;
        }

        if (dto.IsInternal.HasValue && dto.IsInternal.Value != ticket.IsInternal)
        {
            changes.Add(CreateHistory(ticketId, userId, "IsInternal", ticket.IsInternal.ToString(), dto.IsInternal.Value.ToString()));
            ticket.IsInternal = dto.IsInternal.Value;
        }

        ticket.UpdatedAt = DateTime.UtcNow;

        if (changes.Count > 0)
            await _context.TicketHistories.AddRangeAsync(changes);

        await _context.SaveChangesAsync();
        InvalidateDashboardCache(ticket.OrganizationId);

        return ticket;
    }

    public async Task<Ticket?> ChangeStatusAsync(Guid ticketId, Guid newStatusId, Guid userId)
    {
        Ticket? ticket = await _context.Tickets
            .Include(t => t.TicketStatus)
            .Include(t => t.CreatedBy)
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

        if (ticket.CreatedBy.Role == UserRole.Client && ticket.CreatedById != userId)
        {
            User? actor = await _context.Users.FindAsync(userId);
            string ticketUrl = $"{_configuration["Frontend:BaseUrl"]}/tickets/{ticketId}";
            try
            {
                await _emailService.SendTicketUpdateToClientAsync(
                    ticket.CreatedBy.Email,
                    ticket.CreatedBy.FullName,
                    ticket.Title,
                    actor?.FullName ?? "Un membre de l'équipe",
                    "changé le statut de",
                    "Nouveau statut",
                    newStatus.Name,
                    ticketUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Échec envoi notification changement statut au client {Email}", ticket.CreatedBy.Email);
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

    public async Task<TicketComment> AddCommentAsync(Guid ticketId, string content, Guid authorId, bool isInternal = false)
    {
        Ticket? ticket = await _context.Tickets
            .Include(t => t.CreatedBy)
            .Include(t => t.Organization)
            .FirstOrDefaultAsync(t => t.Id == ticketId);
        if (ticket == null)
            throw new InvalidOperationException("Ticket introuvable");

        TicketComment comment = new TicketComment
        {
            TicketId = ticketId,
            AuthorId = authorId,
            Content = content,
            IsInternal = isInternal,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _context.TicketComments.AddAsync(comment);
        ticket.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        User? author = await _context.Users.FindAsync(authorId);

        if (author?.Role == UserRole.Client)
        {
            await NotifyAdminsIfClientTicketAsync(ticket, authorId, ticket.OrganizationId, "Nouveau commentaire client", "Commentaire", content);
        }
        else if (!isInternal && ticket.CreatedBy.Role == UserRole.Client && ticket.CreatedById != authorId)
        {
            string ticketUrl = $"{_configuration["Frontend:BaseUrl"]}/tickets/{ticketId}";
            string actorName = author?.FullName ?? "Un membre de l'équipe";
            try
            {
                await _emailService.SendTicketUpdateToClientAsync(
                    ticket.CreatedBy.Email,
                    ticket.CreatedBy.FullName,
                    ticket.Title,
                    actorName,
                    "répondu à",
                    "Réponse",
                    content,
                    ticketUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Échec envoi notification commentaire au client {Email}", ticket.CreatedBy.Email);
            }
        }

        return comment;
    }

    public async Task<TicketDto?> GetTicketWithDetailsAsync(Guid ticketId)
    {
        Ticket? ticket = await _context.Tickets
            .AsNoTracking()
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
            IsInternal = ticket.IsInternal,
            Tags = ticket.GetTags().ToList(),
            TotalTimeMinutes = ticket.TimeEntries?.Sum(te => te.DurationMinutes) ?? 0,
            Comments = ticket.Comments?.Select(c => new TicketCommentDto
            {
                Id = c.Id,
                AuthorId = c.AuthorId,
                AuthorName = c.Author?.FullName ?? string.Empty,
                Content = c.Content,
                IsInternal = c.IsInternal,
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

    private async Task NotifyAdminsIfClientTicketAsync(Ticket ticket, Guid actorId, Guid organizationId, string eventLabel, string contentLabel, string contentPreview)
    {
        User? actor = await _context.Users.FindAsync(actorId);
        if (actor?.Role != UserRole.Client)
            return;

        List<string> adminEmails = await _context.Users
            .Where(u => u.OrganizationId == organizationId && u.Role == UserRole.Admin && u.IsActive)
            .Select(u => u.Email)
            .ToListAsync();

        if (adminEmails.Count == 0)
            return;

        string orgName = await _context.Organizations
            .Where(o => o.Id == organizationId)
            .Select(o => o.Name)
            .FirstOrDefaultAsync() ?? string.Empty;

        string ticketUrl = $"{_configuration["Frontend:BaseUrl"]}/tickets/{ticket.Id}";
        string preview = contentPreview.Length > 300 ? contentPreview[..300] + "…" : contentPreview;

        try
        {
            await _emailService.SendNewClientTicketToAdminsAsync(
                adminEmails,
                actor.FullName,
                ticket.Title,
                orgName,
                eventLabel,
                contentLabel,
                preview,
                ticketUrl);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Échec envoi notification admins pour ticket client");
        }
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
