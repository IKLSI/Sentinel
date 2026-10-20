using FluentAssertions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Tests.Services;

public class FindingKeysTests
{
    [Fact]
    public void ForVulnerability_NormaliseEnMinuscules()
    {
        FindingKeys.ForVulnerability(DependencyEcosystem.Npm, "Lodash", "GHSA-AbCd")
            .Should().Be("npm:lodash:ghsa-abcd");
    }

    [Fact]
    public void ForDependency_IgnoreLaVersion()
    {
        FindingKeys.ForDependency(DependencyEcosystem.NuGet, "Newtonsoft.Json")
            .Should().Be("nuget:newtonsoft.json");
    }

    [Fact]
    public void ForRuntime_NeDependQueDuNom()
    {
        FindingKeys.ForRuntime(" Node.js ").Should().Be("node.js");
    }

    [Fact]
    public void AdvisoryOf_ExtraitLAvisMemeAvecUnPaquetMavenACoordonnees()
    {
        string key = FindingKeys.ForVulnerability(DependencyEcosystem.Maven, "org.apache:log4j", "CVE-2021-44228");

        FindingKeys.AdvisoryOf(key).Should().Be("cve-2021-44228");
    }

    [Fact]
    public void PackageOf_ConserveLesDeuxPointsDuNomMaven()
    {
        string key = FindingKeys.ForDependency(DependencyEcosystem.Maven, "org.apache:log4j");

        FindingKeys.PackageOf(key).Should().Be("org.apache:log4j");
    }
}
