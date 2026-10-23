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
    public void RemediableFindings_SkipsSuppressedAndIneligibleVulnerabilities()
    {
        Dependency lodash = DependencyWith("lodash", "4.17.15", true, ("CVE-1", "4.17.21"), ("CVE-2", "4.17.19"));
        Dependency minimist = DependencyWith("minimist", "1.2.0", false, ("CVE-3", "1.2.6"));
        HashSet<string> suppressed = [FindingKeys.ForVulnerability(DependencyEcosystem.Npm, "lodash", "CVE-2")];

        RemediationRules.RemediableFindings([lodash, minimist], suppressed)
            .Select(finding => finding.Vulnerability.CveId)
            .Should().Equal("CVE-1");
    }

    [Fact]
    public void TargetsFor_SeveralVulnerabilitiesOnOnePackage_TargetsTheHighestFixedVersion()
    {
        Dependency lodash = DependencyWith("lodash", "4.17.15", true, ("CVE-1", "4.17.21"), ("CVE-2", "4.17.19"));
        Dependency axios = DependencyWith("axios", "1.6.0", true, ("CVE-3", "1.7.4"));

        IReadOnlyList<RemediationTarget> targets =
            RemediationRules.TargetsFor(RemediationRules.RemediableFindings([lodash, axios], new HashSet<string>()));

        targets.Select(target => (target.PackageName, target.TargetVersion))
            .Should().Equal(("axios", "1.7.4"), ("lodash", "4.17.21"));
        targets[1].Advisories.Select(advisory => advisory.CveId).Should().Equal("CVE-1", "CVE-2");
        targets[1].CurrentVersions.Should().Equal("4.17.15");
    }

    [Fact]
    public void TargetsFor_FixRequiringMajorUpgrade_FlagsTheTarget()
    {
        Dependency express = DependencyWith("express", "4.18.0", true, ("CVE-1", "5.0.1"));

        RemediationRules.TargetsFor(RemediationRules.RemediableFindings([express], new HashSet<string>()))
            .Single().IsMajorUpgrade.Should().BeTrue();
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

    private static Dependency DependencyWith(string name, string currentVersion, bool isDirect,
        params (string CveId, string FixedVersion)[] vulnerabilities) => new()
    {
        Name = name,
        CurrentVersion = currentVersion,
        IsDirect = isDirect,
        Vulnerabilities = vulnerabilities
            .Select(vulnerability => new Vulnerability
            {
                CveId = vulnerability.CveId,
                PackageName = name,
                FixedVersion = vulnerability.FixedVersion
            })
            .ToList()
    };
}
