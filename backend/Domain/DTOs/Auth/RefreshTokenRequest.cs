using System.ComponentModel.DataAnnotations;

namespace TMAflow.Domain.DTOs.Auth;

public class RefreshTokenRequest
{
    [Required(ErrorMessage = "Le refresh token est requis")]
    public string RefreshToken { get; set; } = string.Empty;
}
