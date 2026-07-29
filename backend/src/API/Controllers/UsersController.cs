using System.Security.Cryptography;
using System.Text;
using Asp.Versioning;
using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Sentinel.API.Attributes;
using Sentinel.Domain.Abstractions;
using Sentinel.Infrastructure.Data;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Users;
using Sentinel.Domain.Models;
using Sentinel.Application.Services;
using Sentinel.API.Jobs;

namespace Sentinel.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/users")]
[Route("api/v{version:apiVersion}/users")]
[Authorize]
public class UsersController : BaseController
{
    private readonly SentinelContext _context;
    private readonly IBackgroundJobClient _jobs;
    private readonly IAuditLogService _auditLog;
    private readonly ISystemScope _systemScope;
    private readonly QuotaService _quotaService;
    private readonly ApiKeyService _apiKeyService;

    public UsersController(SentinelContext context, IBackgroundJobClient jobs, IAuditLogService auditLog, ISystemScope systemScope, QuotaService quotaService, ApiKeyService apiKeyService)
    {
        _context = context;
        _jobs = jobs;
        _auditLog = auditLog;
        _systemScope = systemScope;
        _quotaService = quotaService;
        _apiKeyService = apiKeyService;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null)
    {
        Guid? organizationId = GetOrganizationId();

        if (organizationId == null) return Unauthorized();

        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 50;
        if (pageSize > 100) pageSize = 100;

        IQueryable<User> query = _context.Users
            .AsNoTracking()
            .Where(u => u.OrganizationId == organizationId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            string pattern = $"%{search.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_")}%";

            query = query.Where(u =>
                EF.Functions.ILike(u.FirstName, pattern) ||
                EF.Functions.ILike(u.LastName, pattern) ||
                EF.Functions.ILike(u.Email, pattern));
        }

        int total = await query.CountAsync();

        List<User> users = await query
            .OrderBy(u => u.LastName)
            .ThenBy(u => u.FirstName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        List<UserDto> items = users.Select(MapToDto).ToList();

        return Ok(new
        {
            items,
            total,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling((double)total / pageSize)
        });
    }

    [HttpPost]
    [AuthorizeRoles(UserRole.Admin)]
    public async Task<IActionResult> InviteUser([FromBody] CreateUserDto dto)
    {
        Guid? organizationId = GetOrganizationId();
        Guid? currentUserId = GetCurrentUserId();

        if (organizationId == null || currentUserId == null) return Unauthorized();

        bool userExists = await _context.Users
            .AnyAsync(u => u.Email == dto.Email.ToLower() && u.OrganizationId == organizationId.Value);

        if (userExists)
            return Conflict(new { message = "Un utilisateur avec cet email existe déjà" });

        bool pendingInvitation = await _context.UserInvitations
            .AnyAsync(i => i.Email == dto.Email.ToLower() && i.OrganizationId == organizationId.Value && i.AcceptedAt == null && i.ExpiresAt > DateTime.UtcNow);

        if (pendingInvitation)
            return Conflict(new { message = "Une invitation est déjà en attente pour cet email" });

        await _quotaService.EnsureCanInviteMemberAsync(organizationId.Value);

        if (!Enum.TryParse<UserRole>(dto.Role, true, out UserRole role))
            return BadRequest(new { message = "Rôle invalide. Valeurs acceptées : Admin, Developer" });

        string rawToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(48));

        UserInvitation invitation = new UserInvitation
        {
            OrganizationId = organizationId.Value,
            Email = dto.Email.ToLower(),
            Role = role,
            TokenHash = HashToken(rawToken),
            InvitedById = currentUserId.Value,
            ExpiresAt = DateTime.UtcNow.AddHours(48),
            CreatedAt = DateTime.UtcNow
        };

        await _context.UserInvitations.AddAsync(invitation);
        await _context.SaveChangesAsync();

        _jobs.Enqueue<SendInvitationEmailJob>(j => j.ExecuteAsync(invitation.Id, rawToken));

        await _auditLog.LogAsync(
            AuditAction.UserInvited,
            entityType: AuditEntityTypes.User,
            organizationId: organizationId.Value,
            userId: currentUserId.Value,
            entityId: invitation.Id,
            jti: GetCurrentJti());

        return Accepted(new { message = "Invitation envoyée" });
    }

    [HttpPost("accept-invitation")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.Invitation)]
    public async Task<IActionResult> AcceptInvitation([FromBody] AcceptInvitationDto dto)
    {
        using IDisposable elevation = _systemScope.Enter();

        string tokenHash = HashToken(dto.Token);

        UserInvitation? invitation = await _context.UserInvitations
            .FirstOrDefaultAsync(i => i.TokenHash == tokenHash && i.AcceptedAt == null && i.ExpiresAt > DateTime.UtcNow);

        if (invitation == null)
            return BadRequest(new { message = "Invitation invalide ou expirée" });

        bool emailExists = await _context.Users
            .AnyAsync(u => u.Email == invitation.Email && u.OrganizationId == invitation.OrganizationId);

        if (emailExists)
            return Conflict(new { message = "Un compte existe déjà avec cet email" });

        User user = new User
        {
            OrganizationId = invitation.OrganizationId,
            Email = invitation.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Role = invitation.Role,
            IsActive = true,
            IsEmailVerified = true,
            CreatedAt = DateTime.UtcNow
        };

        invitation.AcceptedAt = DateTime.UtcNow;

        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        await _auditLog.LogAsync(
            AuditAction.InvitationAccepted,
            entityType: AuditEntityTypes.User,
            organizationId: invitation.OrganizationId,
            entityId: user.Id,
            jti: GetCurrentJti());

        return Ok(new { message = "Compte créé avec succès" });
    }

    [HttpPut("{id:guid}")]
    [AuthorizeRoles(UserRole.Admin)]
    public async Task<ActionResult<UserDto>> UpdateUser(Guid id, [FromBody] UpdateUserDto dto)
    {
        Guid? organizationId = GetOrganizationId();
        Guid? currentUserId = GetCurrentUserId();

        if (organizationId == null || currentUserId == null) return Unauthorized();

        User? user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id && u.OrganizationId == organizationId.Value);

        if (user == null)
            return NotFound(new { message = "Utilisateur introuvable" });

        if (!string.IsNullOrEmpty(dto.FirstName)) user.FirstName = dto.FirstName;
        if (!string.IsNullOrEmpty(dto.LastName)) user.LastName = dto.LastName;

        UserRole originalRole = user.Role;
        bool willDeactivate = dto.IsActive.HasValue && !dto.IsActive.Value;
        bool willDemote = !string.IsNullOrEmpty(dto.Role)
            && Enum.TryParse<UserRole>(dto.Role, true, out UserRole parsedRole)
            && parsedRole != UserRole.Admin
            && user.Role == UserRole.Admin;

        if (id == currentUserId.Value && (willDeactivate || willDemote))
        {
            int activeAdmins = await _context.Users.CountAsync(u =>
                u.OrganizationId == organizationId.Value
                && u.Role == UserRole.Admin
                && u.IsActive);

            if (activeAdmins <= 1)
                return BadRequest(new { message = "Au moins un administrateur actif est requis" });
        }

        if (dto.IsActive.HasValue) user.IsActive = dto.IsActive.Value;

        if (!string.IsNullOrEmpty(dto.Role))
        {
            if (!Enum.TryParse<UserRole>(dto.Role, true, out UserRole role))
                return BadRequest(new { message = "Rôle invalide" });

            user.Role = role;
        }

        if (user.Role != originalRole || willDeactivate) user.TokenVersion++;

        await _context.SaveChangesAsync();

        if (willDeactivate) await _apiKeyService.RevokeAllForUserAsync(user.Id);

        await _auditLog.LogAsync(
            AuditAction.UserUpdated,
            entityType: AuditEntityTypes.User,
            organizationId: organizationId.Value,
            userId: currentUserId.Value,
            entityId: id,
            jti: GetCurrentJti());

        return Ok(MapToDto(user));
    }

    [HttpPatch("me/preferences")]
    public async Task<IActionResult> UpdatePreferences([FromBody] UpdatePreferencesDto dto)
    {
        Guid? currentUserId = GetCurrentUserId();
        Guid? organizationId = GetOrganizationId();

        if (currentUserId == null || organizationId == null) return Unauthorized();

        User? user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == currentUserId.Value && u.OrganizationId == organizationId.Value);

        if (user == null)
            return NotFound(new { message = "Utilisateur introuvable" });

        if (!string.IsNullOrEmpty(dto.Theme) && Enum.TryParse<ThemeType>(dto.Theme, ignoreCase: true, out ThemeType parsedTheme))
            user.Theme = parsedTheme;

        if (!string.IsNullOrEmpty(dto.Language) && LanguageValues.All.Contains(dto.Language))
            user.Language = dto.Language;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("me")]
    public async Task<ActionResult<UserDto>> UpdateMyProfile([FromBody] UpdateMyProfileDto dto)
    {
        Guid? currentUserId = GetCurrentUserId();
        Guid? organizationId = GetOrganizationId();

        if (currentUserId == null || organizationId == null) return Unauthorized();

        User? user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == currentUserId.Value && u.OrganizationId == organizationId.Value);

        if (user == null)
            return NotFound(new { message = "Utilisateur introuvable" });

        if (!string.IsNullOrEmpty(dto.FirstName)) user.FirstName = dto.FirstName;
        if (!string.IsNullOrEmpty(dto.LastName)) user.LastName = dto.LastName;

        await _context.SaveChangesAsync();

        await _auditLog.LogAsync(
            AuditAction.ProfileUpdated,
            entityType: AuditEntityTypes.User,
            organizationId: organizationId.Value,
            userId: currentUserId.Value,
            entityId: currentUserId.Value,
            jti: GetCurrentJti());

        return Ok(MapToDto(user));
    }

    [HttpGet("me/export")]
    public async Task<IActionResult> ExportMyData()
    {
        Guid? currentUserId = GetCurrentUserId();
        Guid? organizationId = GetOrganizationId();

        if (currentUserId == null || organizationId == null) return Unauthorized();

        User? user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == currentUserId.Value && u.OrganizationId == organizationId.Value);

        if (user == null) return NotFound(new { message = "Utilisateur introuvable" });

        List<object> auditLogs = await _context.AuditLogs
            .AsNoTracking()
            .Where(al => al.UserId == currentUserId.Value)
            .OrderByDescending(al => al.CreatedAt)
            .Select(al => (object)new
            {
                al.Id,
                action = al.Action.ToString(),
                al.EntityType,
                al.EntityId,
                al.CreatedAt
            })
            .ToListAsync();

        var export = new
        {
            exportedAt = DateTime.UtcNow,
            profile = new
            {
                user.Id,
                user.Email,
                user.FirstName,
                user.LastName,
                role = user.Role.ToString(),
                user.CreatedAt,
                user.LastLoginAt,
                user.Language
            },
            auditLogs
        };

        return Ok(export);
    }

    [HttpDelete("me")]
    public async Task<IActionResult> DeleteMyAccount([FromBody] DeleteAccountDto dto)
    {
        Guid? currentUserId = GetCurrentUserId();
        Guid? organizationId = GetOrganizationId();

        if (currentUserId == null || organizationId == null) return Unauthorized();

        User? user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == currentUserId.Value && u.OrganizationId == organizationId.Value);

        if (user == null) return NotFound(new { message = "Utilisateur introuvable" });

        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return BadRequest(new { message = "Mot de passe incorrect" });

        if (user.Role == UserRole.Admin)
        {
            int activeAdmins = await _context.Users.CountAsync(u =>
                u.OrganizationId == organizationId.Value
                && u.Role == UserRole.Admin
                && u.IsActive);

            if (activeAdmins <= 1)
                return BadRequest(new { message = "Impossible de supprimer le seul administrateur actif" });
        }

        await _context.AuditLogs
            .Where(al => al.UserId == currentUserId.Value)
            .ExecuteUpdateAsync(s => s.SetProperty(al => al.UserId, (Guid?)null));

        await _context.Notifications
            .Where(n => n.UserId == currentUserId.Value)
            .ExecuteDeleteAsync();

        user.Email = $"supprime_{user.Id}@sentinel.invalid";
        user.FirstName = "Utilisateur";
        user.LastName = "Supprimé";
        user.PasswordHash = string.Empty;
        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;
        user.PreviousRefreshTokenHash = null;
        user.IsActive = false;
        user.TokenVersion++;

        await _context.SaveChangesAsync();

        await _apiKeyService.RevokeAllForUserAsync(user.Id);

        await _auditLog.LogAsync(
            AuditAction.AccountDeleted,
            entityType: AuditEntityTypes.User,
            organizationId: organizationId.Value,
            entityId: currentUserId.Value,
            jti: GetCurrentJti());

        return NoContent();
    }

    private static UserDto MapToDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = user.Role.ToString(),
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt,
            Theme = user.Theme.ToString().ToLowerInvariant(),
            Language = user.Language,
        };
    }

    private static string HashToken(string rawToken)
    {
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
