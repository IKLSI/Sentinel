using FluentAssertions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Tests.Services;

public class PackageNameNormalizerTests
{
    [Theory]
    [InlineData("Django", "django")]
    [InlineData("zope.interface", "zope-interface")]
    [InlineData("ruamel_yaml", "ruamel-yaml")]
    [InlineData("Flask__SQLAlchemy", "flask-sqlalchemy")]
    [InlineData("typing-extensions", "typing-extensions")]
    [InlineData("  requests  ", "requests")]
    public void ForVulnerabilityFeed_PyPI_AppliesPep503(string raw, string expected)
    {
        PackageNameNormalizer.ForVulnerabilityFeed(DependencyEcosystem.PyPI, raw).Should().Be(expected);
    }

    [Theory]
    [InlineData(DependencyEcosystem.Npm, "@babel/Core")]
    [InlineData(DependencyEcosystem.Go, "github.com/Gin-Gonic/gin")]
    [InlineData(DependencyEcosystem.Maven, "org.Spring:spring_core")]
    [InlineData(DependencyEcosystem.NuGet, "Microsoft.Extensions.Logging")]
    public void ForVulnerabilityFeed_OtherEcosystems_AreLeftUntouched(DependencyEcosystem ecosystem, string raw)
    {
        PackageNameNormalizer.ForVulnerabilityFeed(ecosystem, raw).Should().Be(raw);
    }

    [Theory]
    [InlineData("PyPI", "Zope.Interface", "zope-interface")]
    [InlineData("pypi", "Zope.Interface", "zope-interface")]
    [InlineData("npm", "Zope.Interface", "Zope.Interface")]
    [InlineData(null, "Zope.Interface", "Zope.Interface")]
    public void ForVulnerabilityFeed_FromEcosystemName_MatchesTheTypedOverload(string? ecosystemName, string raw,
        string expected)
    {
        PackageNameNormalizer.ForVulnerabilityFeed(ecosystemName, raw).Should().Be(expected);
    }
}
