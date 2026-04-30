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
    [MaxLength(254)]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Le rôle est requis")]
    [MaxLength(50)]
    public string Role { get; set; } = "Developer";
}

public class AcceptInvitationDto
{
    [Required(ErrorMessage = "Le token est requis")]
    [MaxLength(200)]
    public string Token { get; set; } = string.Empty;

    [Required(ErrorMessage = "Le prénom est requis")]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Le nom est requis")]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Le mot de passe est requis")]
    [MinLength(12, ErrorMessage = "Le mot de passe doit contenir au moins 12 caractères")]
    [MaxLength(128)]
    [RegularExpression(
        @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$",
        ErrorMessage = "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial")]
    public string Password { get; set; } = string.Empty;
}

public class UpdateUserDto
{
    [MaxLength(100)]
    public string? FirstName { get; set; }
    [MaxLength(100)]
    public string? LastName { get; set; }
    [MaxLength(50)]
    public string? Role { get; set; }
    public bool? IsActive { get; set; }
}

public class UpdatePreferencesDto
{
    [MaxLength(20)]
    public string? Theme { get; set; }
}

public class UpdateMyProfileDto
{
    [MaxLength(100)]
    public string? FirstName { get; set; }
    [MaxLength(100)]
    public string? LastName { get; set; }
}

public class ChangePasswordDto
{
    [Required(ErrorMessage = "L'ancien mot de passe est requis")]
    [MaxLength(128)]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "Le nouveau mot de passe est requis")]
    [MinLength(12, ErrorMessage = "Le mot de passe doit contenir au moins 12 caractères")]
    [MaxLength(128)]
    [RegularExpression(
        @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$",
        ErrorMessage = "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial")]
    public string NewPassword { get; set; } = string.Empty;
}
