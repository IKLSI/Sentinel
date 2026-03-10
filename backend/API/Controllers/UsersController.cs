using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TMAflow.Infrastructure.Data;
using TMAflow.Domain.DTOs.Users;
using TMAflow.Domain.Models;
using TMAflow.Application.Services;

namespace TMAflow.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly TMAflowContext _context;
    private readonly AuditService _auditService;

    public UsersController(TMAflowContext context, AuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        List<User> users = await _context.Users
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

        string? userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        if (userRole != "Admin" && userRole != "Manager" && currentUserId != id)
            return Forbid();

        User? user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id && u.OrganizationId == organizationId.Value);

        if (user == null)
            return NotFound(new { message = "Utilisateur introuvable" });

        return Ok(MapToDto(user));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserDto dto)
    {
        Guid? organizationId = GetOrganizationId();
        Guid? currentUserId = GetCurrentUserId();
        if (organizationId == null || currentUserId == null) return Unauthorized();

        bool emailExists = await _context.Users
            .AnyAsync(u => u.Email == dto.Email.ToLower() && u.OrganizationId == organizationId.Value);

        if (emailExists)
            return Conflict(new { message = "Un utilisateur avec cet email existe déjà" });

        if (!Enum.TryParse<UserRole>(dto.Role, true, out UserRole role))
            return BadRequest(new { message = "Rôle invalide. Valeurs acceptées : Admin, Manager, Developer" });

        User user = new User
        {
            OrganizationId = organizationId.Value,
            Email = dto.Email.ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Role = role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();
        await _auditService.LogAsync(currentUserId, "USER_CREATED", "User", user.Id, new { user.Email, user.Role });

        return CreatedAtAction(nameof(GetUser), new { id = user.Id }, MapToDto(user));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
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
        if (dto.IsActive.HasValue) user.IsActive = dto.IsActive.Value;

        if (!string.IsNullOrEmpty(dto.Role))
        {
            if (!Enum.TryParse<UserRole>(dto.Role, true, out UserRole role))
                return BadRequest(new { message = "Rôle invalide" });
            user.Role = role;
        }

        await _context.SaveChangesAsync();
        await _auditService.LogAsync(currentUserId, "USER_UPDATED", "User", id);

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

    [HttpPost("{id:guid}/change-password")]
    public async Task<IActionResult> ChangePassword(Guid id, [FromBody] ChangePasswordDto dto)
    {
        Guid? currentUserId = GetCurrentUserId();
        Guid? organizationId = GetOrganizationId();
        if (currentUserId == null || organizationId == null) return Unauthorized();

        if (currentUserId != id)
            return Forbid();

        User? user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id && u.OrganizationId == organizationId.Value);

        if (user == null)
            return NotFound(new { message = "Utilisateur introuvable" });

        if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
            return BadRequest(new { message = "Mot de passe actuel incorrect" });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;

        await _context.SaveChangesAsync();

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
            LastLoginAt = user.LastLoginAt
        };
    }

    private Guid? GetCurrentUserId()
    {
        string? claim = User.FindFirst("userId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out Guid id) ? id : null;
    }

    private Guid? GetOrganizationId()
    {
        string? claim = User.FindFirst("organizationId")?.Value;
        return Guid.TryParse(claim, out Guid id) ? id : null;
    }
}
