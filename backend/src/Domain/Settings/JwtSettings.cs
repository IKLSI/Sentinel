using System.ComponentModel.DataAnnotations;

namespace Sentinel.Domain.Settings;

public class JwtSettings
{
    public string Secret { get; set; } = string.Empty;

    public string Issuer { get; set; } = "Sentinel";

    public string Audience { get; set; } = "Sentinel";

    [Range(1, 1440, ErrorMessage = "Jwt:AccessTokenExpirationMinutes doit être compris entre 1 et 1440")]
    public int AccessTokenExpirationMinutes { get; set; } = 15;

    [Range(1, 365, ErrorMessage = "Jwt:RefreshTokenExpirationDays doit être compris entre 1 et 365")]
    public int RefreshTokenExpirationDays { get; set; } = 30;
}
