using FluentAssertions;
using Sentinel.Application.Security;
using Sentinel.Application.TechHealth;
using Sentinel.Application.TechHealth.Scan;
using Sentinel.Domain.Models;

namespace Sentinel.Tests.Services;

public class LockfileRegistryTests
{
    [Theory]
    [InlineData("package-lock.json", DependencyEcosystem.Npm, "npm install")]
    [InlineData("yarn.lock", DependencyEcosystem.Npm, "yarn install")]
    [InlineData("poetry.lock", DependencyEcosystem.PyPI, "poetry lock --no-update")]
    [InlineData("composer.lock", DependencyEcosystem.Composer, "composer update --lock")]
    [InlineData("Cargo.lock", DependencyEcosystem.Cargo, "cargo update")]
    [InlineData("go.sum", DependencyEcosystem.Go, "go mod tidy")]
    [InlineData("packages.lock.json", DependencyEcosystem.NuGet, "dotnet restore --force-evaluate")]
    [InlineData("Package.resolved", DependencyEcosystem.Swift, "swift package resolve")]
    public void TryGet_KnownLockfile_ReturnsEcosystemAndCommand(string fileName, DependencyEcosystem ecosystem, string command)
    {
        bool found = LockfileRegistry.TryGet(fileName, out LockfileInfo info);

        found.Should().BeTrue();
        info.Ecosystem.Should().Be(ecosystem);
        info.RegenerationCommand.Should().Be(command);
    }

    [Fact]
    public void TryGet_IsCaseInsensitive()
    {
        LockfileRegistry.TryGet("PACKAGE-LOCK.JSON", out LockfileInfo info).Should().BeTrue();
        info.Ecosystem.Should().Be(DependencyEcosystem.Npm);
    }

    [Fact]
    public void TryGet_Manifest_ReturnsFalse()
    {
        LockfileRegistry.TryGet("package.json", out _).Should().BeFalse();
    }
}
