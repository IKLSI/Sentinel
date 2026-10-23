using System.Text;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Sentinel.Domain.Constants;
using Sentinel.Application.Security;
using Sentinel.Domain.Entities;
using Sentinel.Application.Options;

namespace Sentinel.Tests.Services;

public class TokenServiceTests
{
    private static readonly string SigningKey = new('k', 48);

    private static TokenService BuildService()
    {
        var settings = new JwtSettings
        {
            Secret = SigningKey,
            Issuer = "test-issuer",
            Audience = "test-audience",
            AccessTokenExpirationMinutes = 60,
        };
        return new TokenService(Options.Create(settings));
    }

    [Fact]
    public void HashRefreshToken_SameInput_ProducesSameHash()
    {
        var svc = BuildService();
        string h1 = svc.HashRefreshToken("abc123");
        string h2 = svc.HashRefreshToken("abc123");
        h1.Should().Be(h2);
    }

    [Fact]
    public void HashRefreshToken_DifferentInput_ProducesDifferentHash()
    {
        var svc = BuildService();
        svc.HashRefreshToken("abc").Should().NotBe(svc.HashRefreshToken("abd"));
    }

    [Fact]
    public void HashRefreshToken_Returns64HexChars()
    {
        var svc = BuildService();
        string hash = svc.HashRefreshToken("token");
        hash.Should().HaveLength(64);
        hash.Should().MatchRegex("^[0-9a-f]+$");
    }

    [Fact]
    public void GenerateRefreshToken_ProducesUniqueTokens()
    {
        var svc = BuildService();
        HashSet<string> tokens = new();
        for (int i = 0; i < 50; i++)
            tokens.Add(svc.GenerateRefreshToken());
        tokens.Should().HaveCount(50);
    }

    [Fact]
    public void GenerateAccessToken_ReturnsValidJwt()
    {
        var svc = BuildService();
        User user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@test.fr",
            OrganizationId = Guid.NewGuid(),
            FirstName = "Test",
            LastName = "User",
            PasswordHash = "x",
            Role = UserRole.Admin
        };

        string token = svc.GenerateAccessToken(user);

        token.Should().NotBeNullOrEmpty();
        token.Split('.').Should().HaveCount(3); // JWT = header.payload.signature
    }

    [Fact]
    public async Task GenerateAccessToken_IsValidatedWithTheExpectedClaims()
    {
        User user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@test.fr",
            OrganizationId = Guid.NewGuid(),
            PasswordHash = "x",
            Role = UserRole.Admin,
            TokenVersion = 3
        };

        string token = BuildService().GenerateAccessToken(user);

        TokenValidationResult result = await new JsonWebTokenHandler().ValidateTokenAsync(token,
            new TokenValidationParameters
            {
                ValidIssuer = "test-issuer",
                ValidAudience = "test-audience",
                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(SigningKey)),
                ClockSkew = TimeSpan.Zero
            });

        result.IsValid.Should().BeTrue();
        result.Claims.Should().Contain(ClaimNames.Role, "Admin");
        result.Claims.Should().Contain(JwtRegisteredClaimNames.Sub, user.Id.ToString());
        result.Claims.Should().Contain(ClaimNames.OrganizationId, user.OrganizationId.ToString());
        result.Claims.Should().Contain(ClaimNames.TokenVersion, "3");
        result.Claims.Should().ContainKey(JwtRegisteredClaimNames.Jti);
        result.Claims.Should().ContainKey(JwtRegisteredClaimNames.Exp);
    }
}
