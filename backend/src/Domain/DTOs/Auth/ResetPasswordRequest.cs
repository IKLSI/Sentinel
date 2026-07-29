namespace Sentinel.Domain.DTOs.Auth;

public class ResetPasswordRequest
{
    public string Token { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
