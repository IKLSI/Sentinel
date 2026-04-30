using System.ComponentModel.DataAnnotations;

namespace Sentinel.Domain.DTOs.Auth;

public class ForgotPasswordRequest
{
    [Required, EmailAddress]
    [MaxLength(254)]
    public string Email { get; set; } = string.Empty;
}
