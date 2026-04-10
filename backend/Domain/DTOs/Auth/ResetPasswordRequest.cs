using System.ComponentModel.DataAnnotations;

namespace Sentinel.Domain.DTOs.Auth;

public class ResetPasswordRequest
{
    [Required]
    public string Token { get; set; } = string.Empty;

    [Required, MinLength(8)]
    public string Password { get; set; } = string.Empty;
}
