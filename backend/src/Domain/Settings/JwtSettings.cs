using System.ComponentModel.DataAnnotations;

namespace Sentinel.Domain.Settings;

public class JwtSettings
{
    public string Secret { get; set; } = string.Empty;

    public string Issuer { get; set; } = "Sentinel";

    public string Audience { get; set; } = "Sentinel";

    [Range(1, 1440, ErrorMessage = "Jwt:AccessTokenExpirationMinutes must be between 1 and 1440")]
    public int AccessTokenExpirationMinutes { get; set; } = 15;

    [Range(1, 365, ErrorMessage = "Jwt:RefreshTokenExpirationDays must be between 1 and 365")]
    public int RefreshTokenExpirationDays { get; set; } = 30;
}
