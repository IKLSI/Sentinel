using System.ComponentModel.DataAnnotations;

namespace Sentinel.Domain.DTOs.Auth;

public class LoginRequest
{
    [Required(ErrorMessage = "L'email est requis")]
    [EmailAddress(ErrorMessage = "Format d'email invalide")]
    [MaxLength(254)]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Le mot de passe est requis")]
    [MaxLength(128)]
    public string Password { get; set; } = string.Empty;
}
