using FluentAssertions;
using Sentinel.Application.TechHealth.Scan;

namespace Sentinel.Tests.Services;

public class SafeVersionResolverTests
{
    [Fact]
    public void Resolve_SingleFix_ReturnsFixedVersion()
    {
        string? target = SafeVersionResolver.Resolve("4.17.10", new[] { "4.17.21" });

        target.Should().Be("4.17.21");
    }

    [Fact]
    public void Resolve_MultipleFixes_ReturnsHighest()
    {
        string? target = SafeVersionResolver.Resolve("1.0.0", new[] { "1.2.0", "1.5.3", "1.4.0" });

        target.Should().Be("1.5.3");
    }

    [Fact]
    public void Resolve_NoFixedVersion_ReturnsNull()
    {
        string? target = SafeVersionResolver.Resolve("1.0.0", new string?[] { null, "" });

        target.Should().BeNull();
    }

    [Fact]
    public void Resolve_FixBelowCurrent_ReturnsNull()
    {
        string? target = SafeVersionResolver.Resolve("2.0.0", new[] { "1.9.0" });

        target.Should().BeNull();
    }

    [Fact]
    public void Resolve_FixEqualsCurrent_ReturnsNull()
    {
        string? target = SafeVersionResolver.Resolve("1.2.3", new[] { "1.2.3" });

        target.Should().BeNull();
    }

    [Fact]
    public void Resolve_StripsPrereleaseAndPrefix()
    {
        string? target = SafeVersionResolver.Resolve("1.0.0", new[] { "v2.0.0-beta" });

        target.Should().Be("2.0.0");
    }

    [Fact]
    public void Resolve_PrereleaseCurrent_ReleaseFix_ReturnsRelease()
    {
        string? target = SafeVersionResolver.Resolve("2.0.0-rc", new[] { "2.0.0" });

        target.Should().Be("2.0.0");
    }

    [Fact]
    public void Resolve_PrereleaseCurrent_SameCoreLowerPrerelease_ReturnsNull()
    {
        string? target = SafeVersionResolver.Resolve("2.0.0-rc.2", new[] { "2.0.0-rc.1" });

        target.Should().BeNull();
    }

    [Fact]
    public void Resolve_PrereleaseCurrent_HigherPrerelease_ReturnsFix()
    {
        string? target = SafeVersionResolver.Resolve("2.0.0-rc.1", new[] { "2.0.0-rc.2" });

        target.Should().Be("2.0.0");
    }

    [Fact]
    public void IsBreaking_MajorBump_ReturnsTrue()
    {
        SafeVersionResolver.IsBreaking("1.9.0", "2.0.0").Should().BeTrue();
    }

    [Fact]
    public void IsBreaking_MinorBump_ReturnsFalse()
    {
        SafeVersionResolver.IsBreaking("1.2.0", "1.9.0").Should().BeFalse();
    }
}
