using FluentAssertions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Tests.Services;

public class RemediationRulesTests
{
    [Fact]
    public void IsEligible_DirectDependencyWithNewerFix_ReturnsTrue()
    {
        Dependency dependency = new Dependency { Name = "lodash", CurrentVersion = "4.17.15", IsDirect = true };
        Vulnerability vulnerability = new Vulnerability { FixedVersion = "4.17.21" };

        RemediationRules.IsEligible(dependency, vulnerability).Should().BeTrue();
    }

    [Fact]
    public void IsEligible_TransitiveDependency_ReturnsFalse()
    {
        Dependency dependency = new Dependency { Name = "minimist", CurrentVersion = "1.2.0", IsDirect = false };
        Vulnerability vulnerability = new Vulnerability { FixedVersion = "1.2.6" };

        RemediationRules.IsEligible(dependency, vulnerability).Should().BeFalse();
    }

    [Fact]
    public void IsEligible_NoFixedVersion_ReturnsFalse()
    {
        Dependency dependency = new Dependency { Name = "left-pad", CurrentVersion = "1.0.0", IsDirect = true };
        Vulnerability vulnerability = new Vulnerability { FixedVersion = null };

        RemediationRules.IsEligible(dependency, vulnerability).Should().BeFalse();
    }

    [Fact]
    public void IsEligible_CurrentVersionAlreadyFixed_ReturnsFalse()
    {
        Dependency dependency = new Dependency { Name = "axios", CurrentVersion = "1.7.0", IsDirect = true };
        Vulnerability vulnerability = new Vulnerability { FixedVersion = "1.6.0" };

        RemediationRules.IsEligible(dependency, vulnerability).Should().BeFalse();
    }

    [Theory]
    [InlineData("1.2.3", "2.0.0", true)]
    [InlineData("1.2.3", "1.4.0", false)]
    [InlineData("0.3.1", "0.4.0", true)]
    public void IsMajorUpgrade_ComparesCurrentWithFixedVersion(string current, string fixedVersion, bool expected)
    {
        Dependency dependency = new Dependency { CurrentVersion = current };
        Vulnerability vulnerability = new Vulnerability { FixedVersion = fixedVersion };

        RemediationRules.IsMajorUpgrade(dependency, vulnerability).Should().Be(expected);
    }

    [Fact]
    public void BranchNameFor_ScopedPackage_ProducesSafeBranchName()
    {
        RemediationRules.BranchNameFor("@Angular/Core", "17.3.10")
            .Should().Be("sentinel/fix-angular-core-17.3.10");
    }

    [Fact]
    public void BranchNameFor_MavenCoordinates_ReplacesSeparators()
    {
        RemediationRules.BranchNameFor("org.apache.logging.log4j:log4j-core", "2.17.1")
            .Should().Be("sentinel/fix-org.apache.logging.log4j-log4j-core-2.17.1");
    }

    [Theory]
    [InlineData(RemediationStatus.Running, 120, true)]
    [InlineData(RemediationStatus.Queued, 120, true)]
    [InlineData(RemediationStatus.Running, 30, false)]
    [InlineData(RemediationStatus.Opened, 120, false)]
    [InlineData(RemediationStatus.Failed, 120, false)]
    public void IsStale_OnlyInProgressRemediationsPastTheMaximumDuration(RemediationStatus status,
        int minutesSinceUpdate, bool expected)
    {
        DateTime now = new DateTime(2026, 10, 22, 18, 0, 0, DateTimeKind.Utc);
        VulnerabilityRemediation remediation = new VulnerabilityRemediation
        {
            Status = status,
            UpdatedAt = now.AddMinutes(-minutesSinceUpdate)
        };

        RemediationRules.IsStale(remediation, now).Should().Be(expected);
    }
}
