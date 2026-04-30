using System.ComponentModel.DataAnnotations;

namespace Sentinel.Domain.DTOs.Auth;

public class ResetPasswordRequest
{
    [Required]
    [MaxLength(200)]
    public string Token { get; set; } = string.Empty;

    [Required]
    [MinLength(12, ErrorMessage = "Le mot de passe doit contenir au moins 12 caractères")]
    [MaxLength(128)]
    [RegularExpression(
        @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$",
        ErrorMessage = "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial")]
    public string Password { get; set; } = string.Empty;
}
