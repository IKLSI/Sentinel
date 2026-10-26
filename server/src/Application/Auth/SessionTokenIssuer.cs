using Microsoft.Extensions.Options;
using Sentinel.Application.Options;
using Sentinel.Application.Security;
using Sentinel.Domain.Entities;

namespace Sentinel.Application.Auth;

public class SessionTokenIssuer(TokenService tokenService, IOptions<JwtSettings> jwtOptions)
{
    public (string AccessToken, string RefreshToken) Issue(User user)
    {
        string accessToken = tokenService.GenerateAccessToken(user);
        string refreshToken = tokenService.GenerateRefreshToken();

        user.RefreshToken = tokenService.HashRefreshToken(refreshToken);
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(RefreshTokenLifetime.DaysFor(jwtOptions.Value));

        return (accessToken, refreshToken);
    }
}
