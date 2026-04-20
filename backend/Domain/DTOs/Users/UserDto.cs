using System.ComponentModel.DataAnnotations;

namespace Sentinel.Domain.DTOs.Users;

public class UserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public string Theme { get; set; } = "dark";
}

public class CreateUserDto
{
    [Required(ErrorMessage = "L'email est requis")]
    [EmailAddress(ErrorMessage = "Format d'email invalide")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Le rôle est requis")]
    public string Role { get; set; } = "Developer";
}

public class AcceptInvitationDto
{
    [Required(ErrorMessage = "Le token est requis")]
    public string Token { get; set; } = string.Empty;

    [Required(ErrorMessage = "Le prénom est requis")]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Le nom est requis")]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Le mot de passe est requis")]
    [MinLength(8, ErrorMessage = "Le mot de passe doit contenir au moins 8 caractères")]
    public string Password { get; set; } = string.Empty;
}

public class UpdateUserDto
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Role { get; set; }
    public bool? IsActive { get; set; }
}

public class UpdatePreferencesDto
{
    public string? Theme { get; set; }
}

public class UpdateMyProfileDto
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
}

public class ChangePasswordDto
{
    [Required(ErrorMessage = "L'ancien mot de passe est requis")]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "Le nouveau mot de passe est requis")]
    [MinLength(8, ErrorMessage = "Le mot de passe doit contenir au moins 8 caractères")]
    public string NewPassword { get; set; } = string.Empty;
}
