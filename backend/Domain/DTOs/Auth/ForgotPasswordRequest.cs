using System.ComponentModel.DataAnnotations;

namespace Sentinel.Domain.DTOs.Auth;

public class ForgotPasswordRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;
}
