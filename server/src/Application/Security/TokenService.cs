using Microsoft.Extensions.Options;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Application.Common;
using Sentinel.Application.Options;

namespace Sentinel.Application.Security;

public class TokenService
{
    private const int RefreshTokenByteLength = 64;

    private readonly JwtSettings _jwt;

    public TokenService(IOptions<JwtSettings> options)
    {
        _jwt = options.Value;
    }

    public string GenerateAccessToken(User user)
    {
        SymmetricSecurityKey key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Secret));
        SigningCredentials credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        SecurityTokenDescriptor descriptor = new SecurityTokenDescriptor
        {
            Issuer = _jwt.Issuer,
            Audience = _jwt.Audience,
            Expires = DateTime.UtcNow.AddMinutes(_jwt.AccessTokenExpirationMinutes),
            SigningCredentials = credentials,
            Claims = new Dictionary<string, object>
            {
                [JwtRegisteredClaimNames.Sub] = user.Id.ToString(),
                [JwtRegisteredClaimNames.Email] = user.Email,
                [ClaimNames.Role] = user.Role.ToString(),
                [ClaimNames.OrganizationId] = user.OrganizationId.ToString(),
                [ClaimNames.UserId] = user.Id.ToString(),
                [ClaimNames.TokenVersion] = user.TokenVersion.ToString(),
                [JwtRegisteredClaimNames.Jti] = Guid.NewGuid().ToString()
            }
        };

        return new JsonWebTokenHandler().CreateToken(descriptor);
    }

    public string GenerateRefreshToken() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(RefreshTokenByteLength));

    public string HashRefreshToken(string refreshToken) => SecureToken.Hash(refreshToken);
}
