using System.Security.Cryptography;
using FluentAssertions;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Logging.Abstractions;
using Sentinel.Application.Security;

namespace Sentinel.Tests.Services;

public class TokenProtectorTests
{
    private static TokenProtector BuildProtector()
        => new TokenProtector(new EphemeralDataProtectionProvider(), NullLogger<TokenProtector>.Instance);

    private static string LegacyAesGcmPayload()
    {
        byte[] nonce = new byte[AesGcm.NonceByteSizes.MaxSize];
        byte[] tag = new byte[AesGcm.TagByteSizes.MaxSize];
        byte[] ciphertext = new byte[19];

        RandomNumberGenerator.Fill(nonce);
        RandomNumberGenerator.Fill(tag);
        RandomNumberGenerator.Fill(ciphertext);

        byte[] payload = new byte[nonce.Length + tag.Length + ciphertext.Length];
        nonce.CopyTo(payload, 0);
        tag.CopyTo(payload, nonce.Length);
        ciphertext.CopyTo(payload, nonce.Length + tag.Length);

        return Convert.ToBase64String(payload);
    }

    [Fact]
    public void ProtectThenUnprotect_ReturnsOriginalValue()
    {
        var protector = BuildProtector();
        const string token = "ghp_0123456789abcdefghijklmnopqrstuvwxyz";

        protector.Unprotect(protector.Protect(token)).Should().Be(token);
    }

    [Fact]
    public void Protect_ProducesDifferentCiphertextForSameInput()
    {
        var protector = BuildProtector();

        protector.Protect("token").Should().NotBe(protector.Protect("token"));
    }

    [Fact]
    public void Unprotect_LegacyAesGcmPayload_ReturnsNullInsteadOfThrowing()
    {
        var protector = BuildProtector();

        protector.Unprotect(LegacyAesGcmPayload()).Should().BeNull();
    }

    [Fact]
    public void Unprotect_MalformedPayload_ReturnsNullInsteadOfThrowing()
    {
        var protector = BuildProtector();

        protector.Unprotect("pas du tout du base64 !!").Should().BeNull();
    }

    [Fact]
    public void Unprotect_PayloadFromAnotherKeyRing_ReturnsNull()
    {
        string foreign = BuildProtector().Protect("token");

        BuildProtector().Unprotect(foreign).Should().BeNull();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public void Unprotect_EmptyInput_IsPassedThrough(string? value)
    {
        BuildProtector().Unprotect(value).Should().Be(value);
    }

    [Fact]
    public void Protect_EmptyInput_IsPassedThrough()
    {
        BuildProtector().Protect(string.Empty).Should().BeEmpty();
    }
}
