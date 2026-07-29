using Sentinel.Domain.Settings;

namespace Sentinel.Application.Auth;

public static class RefreshTokenLifetime
{
    private const int FallbackDays = 30;

    public static int DaysFor(JwtSettings settings) =>
        settings.RefreshTokenExpirationDays > 0 ? settings.RefreshTokenExpirationDays : FallbackDays;
}
