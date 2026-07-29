namespace Sentinel.Domain.Settings;

public class CookieSettings
{
    public string Name { get; set; } = "refreshToken";
    public string? Domain { get; set; }
    public string SameSite { get; set; } = "Lax";
}
