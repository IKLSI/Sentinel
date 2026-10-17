using FluentAssertions;
using Sentinel.Application.ApiKeys;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Tests.Services;

public class CachedApiKeyAuthenticationTests
{
    private static readonly TimeSpan Threshold = TimeSpan.FromMinutes(1);

    private static CachedApiKeyAuthentication Create(DateTime? lastUsedAt) =>
        new(new ApiKeyAuthenticationRow(Guid.NewGuid(), null, lastUsedAt, Guid.NewGuid(), "dev@sentinel.test",
            UserRole.Developer, UserAccessStatus.Active, Guid.NewGuid()));

    [Fact]
    public void TryClaimLastUsedAtUpdate_QuandJamaisUtilisee_AutoriseUneSeuleMiseAJour()
    {
        CachedApiKeyAuthentication cached = Create(null);
        DateTime now = DateTime.UtcNow;

        cached.TryClaimLastUsedAtUpdate(now, Threshold).Should().BeTrue();
        cached.TryClaimLastUsedAtUpdate(now.AddSeconds(5), Threshold).Should().BeFalse();
    }

    [Fact]
    public void TryClaimLastUsedAtUpdate_QuandUtiliseeRecemment_RefuseLaMiseAJour()
    {
        DateTime now = DateTime.UtcNow;
        CachedApiKeyAuthentication cached = Create(now.AddSeconds(-10));

        cached.TryClaimLastUsedAtUpdate(now, Threshold).Should().BeFalse();
    }

    [Fact]
    public void TryClaimLastUsedAtUpdate_QuandLeSeuilEstDepasse_AutoriseLaMiseAJour()
    {
        DateTime now = DateTime.UtcNow;
        CachedApiKeyAuthentication cached = Create(now.AddMinutes(-2));

        cached.TryClaimLastUsedAtUpdate(now, Threshold).Should().BeTrue();
    }
}
