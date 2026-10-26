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

public class TokenService(IOptions<JwtSettings> options)
{
    private const int RefreshTokenByteLength = 64;

    public string GenerateAccessToken(User user)
    {
        JwtSettings jwt = options.Value;
        SymmetricSecurityKey key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Secret));
        SigningCredentials credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        SecurityTokenDescriptor descriptor = new SecurityTokenDescriptor
        {
            Issuer = jwt.Issuer,
            Audience = jwt.Audience,
            Expires = DateTime.UtcNow.AddMinutes(jwt.AccessTokenExpirationMinutes),
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
