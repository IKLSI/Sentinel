using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sentinel.API.Attributes;
using Sentinel.Infrastructure.Data;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Common;
using Sentinel.Domain.DTOs.Tickets;
using Sentinel.Domain.Models;
using Sentinel.Application.Services;

namespace Sentinel.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/tickets")]
[Route("api/v{version:apiVersion}/tickets")]
[Authorize]
public class TicketsController : BaseController
{
    private readonly SentinelContext _context;
    private readonly TicketService _ticketService;
    private readonly ExportService _exportService;
    private readonly IAuditLogService _auditLog;
    private readonly IWebHostEnvironment _env;

    public TicketsController(SentinelContext context, TicketService ticketService, ExportService exportService, IAuditLogService auditLog, IWebHostEnvironment env)
    {
        _context = context;
        _ticketService = ticketService;
        _exportService = exportService;
        _auditLog = auditLog;
        _env = env;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<TicketDto>>> GetTickets(
        [FromQuery] string? priority,
        [FromQuery] string? status,
        [FromQuery] Guid? assignedTo,
        [FromQuery] string? type,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        Guid? organizationId = GetOrganizationId();

        if (organizationId == null) return Unauthorized();

        IQueryable<Ticket> query = _context.Tickets
            .AsNoTracking()
            .Include(t => t.TicketStatus)
            .Include(t => t.Project)
            .Include(t => t.AssignedTo)
            .Include(t => t.CreatedBy)
            .Where(t => t.OrganizationId == organizationId.Value);

        if (!string.IsNullOrEmpty(priority) && Enum.TryParse<TicketPriority>(priority, true, out TicketPriority parsedPriority))
            query = query.Where(t => t.Priority == parsedPriority);

        if (!string.IsNullOrEmpty(status) && Guid.TryParse(status, out Guid statusGuid))
            query = query.Where(t => t.TicketStatusId == statusGuid);

        if (assignedTo.HasValue)
            query = query.Where(t => t.AssignedToId == assignedTo.Value);

        if (!string.IsNullOrEmpty(type) && Enum.TryParse<TicketType>(type, true, out TicketType parsedType))
            query = query.Where(t => t.Type == parsedType);

        if (!string.IsNullOrWhiteSpace(search))
        {
            if (search.Length > 100)
                return BadRequest(new { message = "Recherche limitée à 100 caractères" });

            string escaped = search
                .Replace("\\", "\\\\")
                .Replace("%", "\\%")
                .Replace("_", "\\_");

            string pattern = $"%{escaped}%";

            query = query.Where(t =>
                EF.Functions.ILike(t.Title, pattern) ||
                EF.Functions.ILike(t.Description, pattern) ||
                _context.TicketComments.Any(c => c.TicketId == t.Id && EF.Functions.ILike(c.Content, pattern))
            );
        }

        int totalCount = await query.CountAsync();

        List<Ticket> tickets = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        List<TicketDto> items = tickets.Select(TicketService.MapToDto).ToList();

        return Ok(new PagedResult<TicketDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    [HttpGet("export/excel")]
    public async Task<IActionResult> ExportExcel(
        [FromQuery] string? priority,
        [FromQuery] string? status,
        [FromQuery] Guid? assignedTo,
        [FromQuery] string? type,
        [FromQuery] string? search)
    {
        Guid? organizationId = GetOrganizationId();
        Guid? userId = GetCurrentUserId();

        if (organizationId == null || userId == null) return Unauthorized();

        ExportResult export = await _exportService.ExportTicketsExcelAsync(
            organizationId.Value, status, priority, assignedTo, type, search, userId.Value);

        return File(export.Content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", export.FileName);
    }

    [HttpPost]
    public async Task<ActionResult<TicketDto>> CreateTicket([FromBody] CreateTicketDto dto)
    {
        Guid? userId = GetCurrentUserId();
        Guid? organizationId = GetOrganizationId();

        if (userId == null || organizationId == null) return Unauthorized();

        Ticket ticket = await _ticketService.CreateTicketAsync(dto, userId.Value, organizationId.Value);
        TicketDto? ticketDto = await _ticketService.GetTicketWithDetailsAsync(ticket.Id);

        await _auditLog.LogAsync(
            AuditAction.TicketCreated,
            entityType: AuditEntityTypes.Ticket,
            organizationId: organizationId.Value,
            userId: userId.Value,
            entityId: ticket.Id,
            jti: GetCurrentJti());

        return CreatedAtAction(nameof(GetTicket), new { id = ticket.Id }, ticketDto);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TicketDto>> GetTicket(Guid id)
    {
        Guid? organizationId = GetOrganizationId();

        if (organizationId == null) return Unauthorized();

        TicketDto? ticket = await _ticketService.GetTicketWithDetailsAsync(id);

        if (ticket == null)
            return NotFound(new { message = "Ticket introuvable" });

        bool exists = await _context.Tickets.AnyAsync(t => t.Id == id && t.OrganizationId == organizationId.Value);

        if (!exists)
            return Forbid();

        return Ok(ticket);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TicketDto>> UpdateTicket(Guid id, [FromBody] UpdateTicketDto dto)
    {
        Guid? userId = GetCurrentUserId();

        if (userId == null) return Unauthorized();

        Guid? organizationId = GetOrganizationId();
        Ticket? ticket = await _context.Tickets.FirstOrDefaultAsync(t => t.Id == id && t.OrganizationId == organizationId);

        if (ticket == null)
            return NotFound(new { message = "Ticket introuvable" });

        await _ticketService.UpdateTicketAsync(id, dto, userId.Value);
        TicketDto? updatedDto = await _ticketService.GetTicketWithDetailsAsync(id);

        await _auditLog.LogAsync(
            AuditAction.TicketUpdated,
            entityType: AuditEntityTypes.Ticket,
            organizationId: organizationId,
            userId: userId.Value,
            entityId: id,
            jti: GetCurrentJti());

        return Ok(updatedDto);
    }

    [HttpDelete("{id:guid}")]
    [AuthorizeRoles(UserRole.Admin)]
    public async Task<IActionResult> DeleteTicket(Guid id)
    {
        Guid? organizationId = GetOrganizationId();

        if (organizationId == null) return Unauthorized();

        bool deleted = await _ticketService.DeleteTicketAsync(id, organizationId.Value);

        if (!deleted)
            return NotFound(new { message = "Ticket introuvable" });

        await _auditLog.LogAsync(
            AuditAction.TicketDeleted,
            entityType: AuditEntityTypes.Ticket,
            organizationId: organizationId,
            userId: GetCurrentUserId(),
            entityId: id,
            jti: GetCurrentJti());

        return NoContent();
    }

    [HttpPost("{id:guid}/comments")]
    public async Task<ActionResult<TicketCommentDto>> AddComment(Guid id, [FromBody] CreateCommentDto dto)
    {
        Guid? userId = GetCurrentUserId();

        if (userId == null) return Unauthorized();

        Guid? organizationId = GetOrganizationId();

        bool ticketExists = await _context.Tickets.AnyAsync(t => t.Id == id && t.OrganizationId == organizationId);

        if (!ticketExists)
            return NotFound(new { message = "Ticket introuvable" });

        if (string.IsNullOrWhiteSpace(dto.Content))
            return BadRequest(new { message = "Le contenu du commentaire est requis" });

        TicketComment comment = await _ticketService.AddCommentAsync(id, dto.Content, userId.Value);

        User? user = await _context.Users.FindAsync(userId.Value);

        await _auditLog.LogAsync(
            AuditAction.CommentAdded,
            entityType: AuditEntityTypes.TicketComment,
            organizationId: organizationId,
            userId: userId.Value,
            entityId: comment.Id,
            jti: GetCurrentJti());

        return CreatedAtAction(nameof(GetTicket), new { id }, new TicketCommentDto
        {
            Id = comment.Id,
            AuthorId = comment.AuthorId,
            AuthorName = user?.FullName ?? string.Empty,
            Content = comment.Content,
            CreatedAt = comment.CreatedAt,
            UpdatedAt = comment.UpdatedAt
        });
    }

    [HttpPut("{id:guid}/comments/{commentId:guid}")]
    public async Task<ActionResult<TicketCommentDto>> UpdateComment(Guid id, Guid commentId, [FromBody] CreateCommentDto dto)
    {
        Guid? userId = GetCurrentUserId();

        if (userId == null) return Unauthorized();

        TicketComment? comment = await _context.TicketComments
            .Include(c => c.Author)
            .FirstOrDefaultAsync(c => c.Id == commentId && c.TicketId == id);

        if (comment == null)
            return NotFound(new { message = "Commentaire introuvable" });

        if (comment.AuthorId != userId.Value)
            return Forbid();

        if (string.IsNullOrWhiteSpace(dto.Content))
            return BadRequest(new { message = "Le contenu du commentaire est requis" });

        comment.Content = dto.Content;
        comment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditLog.LogAsync(
            AuditAction.CommentUpdated,
            entityType: AuditEntityTypes.TicketComment,
            organizationId: GetOrganizationId(),
            userId: userId.Value,
            entityId: commentId,
            jti: GetCurrentJti());

        return Ok(new TicketCommentDto
        {
            Id = comment.Id,
            AuthorId = comment.AuthorId,
            AuthorName = comment.Author?.FullName ?? string.Empty,
            Content = comment.Content,
            CreatedAt = comment.CreatedAt,
            UpdatedAt = comment.UpdatedAt
        });
    }

    [HttpDelete("{id:guid}/comments/{commentId:guid}")]
    public async Task<IActionResult> DeleteComment(Guid id, Guid commentId)
    {
        Guid? userId = GetCurrentUserId();

        if (userId == null) return Unauthorized();

        TicketComment? comment = await _context.TicketComments
            .FirstOrDefaultAsync(c => c.Id == commentId && c.TicketId == id);

        if (comment == null)
            return NotFound(new { message = "Commentaire introuvable" });

        if (comment.AuthorId != userId.Value)
            return Forbid();

        _context.TicketComments.Remove(comment);
        await _context.SaveChangesAsync();

        await _auditLog.LogAsync(
            AuditAction.CommentDeleted,
            entityType: AuditEntityTypes.TicketComment,
            organizationId: GetOrganizationId(),
            userId: userId.Value,
            entityId: commentId,
            jti: GetCurrentJti());

        return NoContent();
    }

    private static readonly string[] AllowedAttachmentMimes =
    [
        "image/jpeg", "image/png", "image/gif", "image/webp",
        "application/pdf", "text/plain", "application/zip",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];

    private string GetAttachmentsRoot() =>
        Path.Combine(_env.ContentRootPath, "App_Data", "attachments");

    [HttpGet("{id:guid}/attachments")]
    public async Task<ActionResult<List<TicketAttachmentDto>>> ListAttachments(Guid id)
    {
        Guid? organizationId = GetOrganizationId();

        if (organizationId == null) return Unauthorized();

        bool ticketExists = await _context.Tickets.AnyAsync(t => t.Id == id && t.OrganizationId == organizationId);

        if (!ticketExists)
            return NotFound(new { message = "Ticket introuvable" });

        List<TicketAttachmentDto> attachments = await _context.TicketAttachments
            .AsNoTracking()
            .Where(a => a.TicketId == id)
            .Include(a => a.UploadedBy)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new TicketAttachmentDto
            {
                Id = a.Id,
                TicketId = a.TicketId,
                FileName = a.FileName,
                ContentType = a.ContentType,
                Size = a.Size,
                UploadedById = a.UploadedById,
                UploadedByName = a.UploadedBy.FirstName + " " + a.UploadedBy.LastName,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync();

        return Ok(attachments);
    }

    [HttpPost("{id:guid}/attachments")]
    [RequestSizeLimit(10_485_760)]
    public async Task<ActionResult<TicketAttachmentDto>> UploadAttachment(Guid id, IFormFile file)
    {
        Guid? userId = GetCurrentUserId();

        if (userId == null) return Unauthorized();

        Guid? organizationId = GetOrganizationId();
        bool ticketExists = await _context.Tickets.AnyAsync(t => t.Id == id && t.OrganizationId == organizationId);

        if (!ticketExists)
            return NotFound(new { message = "Ticket introuvable" });

        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Fichier invalide" });

        if (!AllowedAttachmentMimes.Contains(file.ContentType))
            return BadRequest(new { message = "Type de fichier non autorisé" });

        string originalName = Path.GetFileName(file.FileName);
        string sanitized = string.Concat(originalName.Where(c => !Path.GetInvalidFileNameChars().Contains(c))).Replace(" ", "_");

        if (string.IsNullOrWhiteSpace(sanitized))
            return BadRequest(new { message = "Nom de fichier invalide" });

        Guid attachmentId = Guid.NewGuid();
        string uploadDir = Path.Combine(GetAttachmentsRoot(), id.ToString());

        Directory.CreateDirectory(uploadDir);

        string storedName = $"{attachmentId:N}_{sanitized}";
        string storagePath = Path.Combine(uploadDir, storedName);

        using (FileStream stream = new FileStream(storagePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        TicketAttachment attachment = new TicketAttachment
        {
            Id = attachmentId,
            TicketId = id,
            UploadedById = userId.Value,
            FileName = originalName,
            StoragePath = storagePath,
            ContentType = file.ContentType,
            Size = file.Length,
            CreatedAt = DateTime.UtcNow
        };

        _context.TicketAttachments.Add(attachment);
        await _context.SaveChangesAsync();

        User? uploader = await _context.Users.FindAsync(userId.Value);

        await _auditLog.LogAsync(
            AuditAction.AttachmentUploaded,
            entityType: AuditEntityTypes.TicketAttachment,
            organizationId: organizationId,
            userId: userId.Value,
            entityId: attachmentId,
            jti: GetCurrentJti());

        return Ok(new TicketAttachmentDto
        {
            Id = attachment.Id,
            TicketId = attachment.TicketId,
            FileName = attachment.FileName,
            ContentType = attachment.ContentType,
            Size = attachment.Size,
            UploadedById = attachment.UploadedById,
            UploadedByName = uploader != null ? $"{uploader.FirstName} {uploader.LastName}" : string.Empty,
            CreatedAt = attachment.CreatedAt
        });
    }

    [HttpGet("{id:guid}/attachments/{attachmentId:guid}")]
    public async Task<IActionResult> DownloadAttachment(Guid id, Guid attachmentId)
    {
        Guid? organizationId = GetOrganizationId();

        if (organizationId == null) return Unauthorized();

        TicketAttachment? attachment = await _context.TicketAttachments
            .Include(a => a.Ticket)
            .FirstOrDefaultAsync(a => a.Id == attachmentId && a.TicketId == id);

        if (attachment == null || attachment.Ticket.OrganizationId != organizationId.Value)
            return NotFound(new { message = "Pièce jointe introuvable" });

        if (!System.IO.File.Exists(attachment.StoragePath))
            return NotFound(new { message = "Fichier manquant" });

        FileStream stream = new FileStream(attachment.StoragePath, FileMode.Open, FileAccess.Read, FileShare.Read);

        return File(stream, attachment.ContentType, attachment.FileName);
    }

    [HttpDelete("{id:guid}/attachments/{attachmentId:guid}")]
    public async Task<IActionResult> DeleteAttachment(Guid id, Guid attachmentId)
    {
        Guid? userId = GetCurrentUserId();

        if (userId == null) return Unauthorized();

        Guid? organizationId = GetOrganizationId();
        TicketAttachment? attachment = await _context.TicketAttachments
            .Include(a => a.Ticket)
            .FirstOrDefaultAsync(a => a.Id == attachmentId && a.TicketId == id);

        if (attachment == null || attachment.Ticket.OrganizationId != organizationId)
            return NotFound(new { message = "Pièce jointe introuvable" });

        bool isAdmin = User.IsInRole(UserRole.Admin.ToString());

        if (!isAdmin && attachment.UploadedById != userId.Value)
            return Forbid();

        if (System.IO.File.Exists(attachment.StoragePath))
        {
            try { System.IO.File.Delete(attachment.StoragePath); }
            catch { /* fichier déjà absent ou verrouillé : on supprime quand même la trace DB */ }
        }

        _context.TicketAttachments.Remove(attachment);
        await _context.SaveChangesAsync();

        await _auditLog.LogAsync(
            AuditAction.AttachmentDeleted,
            entityType: AuditEntityTypes.TicketAttachment,
            organizationId: organizationId,
            userId: userId.Value,
            entityId: attachmentId,
            jti: GetCurrentJti());

        return NoContent();
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<TicketDto>> ChangeStatus(Guid id, [FromBody] ChangeStatusDto dto)
    {
        Guid? userId = GetCurrentUserId();

        if (userId == null) return Unauthorized();

        Guid? organizationId = GetOrganizationId();
        bool ticketExists = await _context.Tickets.AnyAsync(t => t.Id == id && t.OrganizationId == organizationId);

        if (!ticketExists)
            return NotFound(new { message = "Ticket introuvable" });

        Ticket? updated = await _ticketService.ChangeStatusAsync(id, dto.StatusId, userId.Value);

        if (updated == null)
            return BadRequest(new { message = "Statut invalide" });

        await _auditLog.LogAsync(
            AuditAction.TicketStatusChanged,
            entityType: AuditEntityTypes.Ticket,
            organizationId: organizationId,
            userId: userId.Value,
            entityId: id,
            jti: GetCurrentJti());

        TicketDto? updatedDto = await _ticketService.GetTicketWithDetailsAsync(id);
        return Ok(updatedDto);
    }
}
