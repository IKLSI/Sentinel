using Asp.Versioning;
using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Sentinel.API.Attributes;
using Sentinel.Infrastructure.Data;
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

    public UsersController(SentinelContext context, IBackgroundJobClient jobs, IAuditLogService auditLog)
    {
        _context = context;
        _jobs = jobs;
        _auditLog = auditLog;
    }

    [HttpGet]
    [AuthorizeRoles(UserRole.Admin)]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        List<User> users = await _context.Users
            .AsNoTracking()
            .Where(u => u.OrganizationId == organizationId.Value)
            .OrderBy(u => u.LastName)
            .ThenBy(u => u.FirstName)
            .ToListAsync();

        List<UserDto> items = users.Select(MapToDto).ToList();
        return Ok(new { items, total = items.Count });
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserDto>> GetUser(Guid id)
    {
        Guid? organizationId = GetOrganizationId();
        Guid? currentUserId = GetCurrentUserId();
        if (organizationId == null || currentUserId == null) return Unauthorized();

        if (!User.IsInRole("Admin") && currentUserId != id)
            return Forbid();

        User? user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id && u.OrganizationId == organizationId.Value);

        if (user == null)
            return NotFound(new { message = "Utilisateur introuvable" });

        return Ok(MapToDto(user));
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

        if (!Enum.TryParse<UserRole>(dto.Role, true, out UserRole role))
            return BadRequest(new { message = "Rôle invalide. Valeurs acceptées : Admin, Developer" });

        UserInvitation invitation = new UserInvitation
        {
            OrganizationId = organizationId.Value,
            Email = dto.Email.ToLower(),
            Role = role,
            Token = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(48)),
            InvitedById = currentUserId.Value,
            ExpiresAt = DateTime.UtcNow.AddHours(48),
            CreatedAt = DateTime.UtcNow
        };

        await _context.UserInvitations.AddAsync(invitation);
        await _context.SaveChangesAsync();

        _jobs.Enqueue<SendInvitationEmailJob>(j => j.ExecuteAsync(invitation.Id));

        await _auditLog.LogAsync(
            AuditAction.UserInvited,
            entityType: "User",
            organizationId: organizationId.Value,
            userId: currentUserId.Value,
            entityId: invitation.Id,
            jti: GetCurrentJti());

        return Accepted(new { message = "Invitation envoyée" });
    }

    [HttpPost("accept-invitation")]
    [AllowAnonymous]
    [EnableRateLimiting("invitation")]
    public async Task<IActionResult> AcceptInvitation([FromBody] AcceptInvitationDto dto)
    {
        UserInvitation? invitation = await _context.UserInvitations
            .FirstOrDefaultAsync(i => i.Token == dto.Token && i.AcceptedAt == null && i.ExpiresAt > DateTime.UtcNow);

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
            CreatedAt = DateTime.UtcNow
        };

        invitation.AcceptedAt = DateTime.UtcNow;

        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        await _auditLog.LogAsync(
            AuditAction.InvitationAccepted,
            entityType: "User",
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

        await _context.SaveChangesAsync();

        await _auditLog.LogAsync(
            AuditAction.UserUpdated,
            entityType: "User",
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

        if (!string.IsNullOrEmpty(dto.Theme) && (dto.Theme == "dark" || dto.Theme == "light"))
            user.Theme = dto.Theme;

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
            entityType: "User",
            organizationId: organizationId.Value,
            userId: currentUserId.Value,
            entityId: currentUserId.Value,
            jti: GetCurrentJti());

        return Ok(MapToDto(user));
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
            Theme = user.Theme,
        };
    }
}
