using FluentAssertions;
using Microsoft.Extensions.Options;
using Sentinel.Application.Security;
using Sentinel.Application.TechHealth;
using Sentinel.Application.TechHealth.Scan;
using Sentinel.Domain.Models;
using Sentinel.Domain.Settings;

namespace Sentinel.Tests.Services;

public class TokenServiceTests
{
    private static TokenService BuildService()
    {
        var settings = new JwtSettings
        {
            Secret = "test-secret-key-with-sufficient-length-1234567890",
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
    public void GetAccessTokenExpiry_ReturnsFutureDate()
    {
        var svc = BuildService();
        DateTime expiry = svc.GetAccessTokenExpiry();
        expiry.Should().BeAfter(DateTime.UtcNow);
        expiry.Should().BeCloseTo(DateTime.UtcNow.AddMinutes(60), TimeSpan.FromSeconds(5));
    }
}
