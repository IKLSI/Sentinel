using System.Text;
using System.Text.Json;
using FluentAssertions;
using Sentinel.Infrastructure.Repositories;
using Sentinel.Application.Exports;
using Sentinel.Application.TechHealth.ExportSbom;
using Sentinel.Domain.Entities;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Services;

public class SbomServiceTests
{
    private const string OrganizationName = "Organisation de test";
    private const string NoAssertion = "NOASSERTION";

    [Fact]
    public async Task GenerateAsync_QuandLeProjetEstIntrouvable_RetourneNull()
    {
        using TestScope scope = new TestScope();
        SbomService sut = new(scope.Projects, scope.Organizations, new VulnerabilitySuppressionRepository(scope.Context));

        ExportResult? result = await sut.GenerateAsync(Guid.NewGuid(), scope.OrganizationId, SbomFormat.CycloneDx,
            CancellationToken.None);

        result.Should().BeNull();
    }

    [Fact]
    public async Task GenerateAsync_EnCycloneDx_DecritLeProjetEtSesDependances()
    {
        using TestScope scope = new TestScope();
        Project project = await SeedProjectAsync(scope);

        SbomService sut = new(scope.Projects, scope.Organizations, new VulnerabilitySuppressionRepository(scope.Context));

        ExportResult? result = await sut.GenerateAsync(project.Id, scope.OrganizationId, SbomFormat.CycloneDx,
            CancellationToken.None);

        result.Should().NotBeNull();
        result!.FileName.Should().Be("sbom-mon-projet-cyclonedx.json");

        JsonElement bom = Parse(result.Content);

        bom.GetProperty("metadata").GetProperty("component").GetProperty("bom-ref").GetString()
            .Should().Be($"sentinel:project:{project.Id}");

        JsonElement components = bom.GetProperty("components");
        components.GetArrayLength().Should().Be(2);
        components.EnumerateArray().Select(component => component.GetProperty("purl").GetString())
            .Should().BeEquivalentTo("pkg:npm/left-pad@1.3.0", "pkg:nuget/Serilog@4.0.0");

        JsonElement dependencies = bom.GetProperty("dependencies");
        dependencies.GetArrayLength().Should().Be(1);
        dependencies[0].GetProperty("ref").GetString().Should().Be($"sentinel:project:{project.Id}");
        dependencies[0].GetProperty("dependsOn").EnumerateArray().Select(reference => reference.GetString())
            .Should().BeEquivalentTo("pkg:npm/left-pad@1.3.0", "pkg:nuget/Serilog@4.0.0");
    }

    [Fact]
    public async Task GenerateAsync_EnCycloneDx_RenseigneLesFournisseursExigesParLaNtia()
    {
        using TestScope scope = new TestScope();
        Project project = await SeedProjectAsync(scope);

        SbomService sut = new(scope.Projects, scope.Organizations, new VulnerabilitySuppressionRepository(scope.Context));

        ExportResult? result = await sut.GenerateAsync(project.Id, scope.OrganizationId, SbomFormat.CycloneDx,
            CancellationToken.None);

        JsonElement metadata = Parse(result!.Content).GetProperty("metadata");

        metadata.GetProperty("supplier").GetProperty("name").GetString().Should().Be(OrganizationName);
        metadata.GetProperty("authors")[0].GetProperty("name").GetString().Should().Be(OrganizationName);
        metadata.GetProperty("component").GetProperty("supplier").GetProperty("name").GetString()
            .Should().Be(OrganizationName);
        metadata.GetProperty("tools").GetProperty("components")[0].GetProperty("name").GetString()
            .Should().Be("Sentinel Tech-Health");

        JsonElement components = Parse(result.Content).GetProperty("components");

        Supplier(components, "left-pad").Should().Be("npm, Inc.");
        Supplier(components, "Serilog").Should().Be(NoAssertion);
    }

    [Fact]
    public async Task GenerateAsync_EnSpdx_PosePackageRacineEtRelationsDependsOn()
    {
        using TestScope scope = new TestScope();
        Project project = await SeedProjectAsync(scope);

        SbomService sut = new(scope.Projects, scope.Organizations, new VulnerabilitySuppressionRepository(scope.Context));

        ExportResult? result = await sut.GenerateAsync(project.Id, scope.OrganizationId, SbomFormat.Spdx,
            CancellationToken.None);

        result.Should().NotBeNull();
        result!.FileName.Should().Be("sbom-mon-projet-spdx.json");

        JsonElement document = Parse(result.Content);

        document.GetProperty("spdxVersion").GetString().Should().Be("SPDX-2.3");
        document.GetProperty("documentDescribes").EnumerateArray().Select(reference => reference.GetString())
            .Should().BeEquivalentTo("SPDXRef-RootPackage");

        JsonElement packages = document.GetProperty("packages");
        packages.GetArrayLength().Should().Be(3);

        JsonElement root = packages.EnumerateArray()
            .Single(package => package.GetProperty("SPDXID").GetString() == "SPDXRef-RootPackage");
        root.GetProperty("name").GetString().Should().Be("Mon Projet");
        root.GetProperty("downloadLocation").GetString().Should().Be("https://github.com/ftel/sentinel");
        root.GetProperty("supplier").GetString().Should().Be($"Organization: {OrganizationName}");

        foreach (JsonElement package in packages.EnumerateArray())
        {
            package.GetProperty("licenseConcluded").GetString().Should().Be(NoAssertion);
            package.GetProperty("licenseDeclared").GetString().Should().Be(NoAssertion);
        }

        List<JsonElement> relationships = document.GetProperty("relationships").EnumerateArray().ToList();

        relationships.Should().HaveCount(3);
        relationships.Should().ContainSingle(relationship =>
            relationship.GetProperty("relationshipType").GetString() == "DESCRIBES" &&
            relationship.GetProperty("spdxElementId").GetString() == "SPDXRef-DOCUMENT" &&
            relationship.GetProperty("relatedSpdxElement").GetString() == "SPDXRef-RootPackage");
        relationships.Count(relationship =>
            relationship.GetProperty("relationshipType").GetString() == "DEPENDS_ON" &&
            relationship.GetProperty("spdxElementId").GetString() == "SPDXRef-RootPackage").Should().Be(2);
    }

    [Fact]
    public async Task GenerateAsync_EnSpdx_QualifieLeFournisseurConnuEtRetombeSurNoAssertion()
    {
        using TestScope scope = new TestScope();
        Project project = await SeedProjectAsync(scope);

        SbomService sut = new(scope.Projects, scope.Organizations, new VulnerabilitySuppressionRepository(scope.Context));

        ExportResult? result = await sut.GenerateAsync(project.Id, scope.OrganizationId, SbomFormat.Spdx,
            CancellationToken.None);

        JsonElement packages = Parse(result!.Content).GetProperty("packages");

        Package(packages, "left-pad").GetProperty("supplier").GetString().Should().Be("Organization: npm, Inc.");
        Package(packages, "Serilog").GetProperty("supplier").GetString().Should().Be(NoAssertion);
    }

    [Fact]
    public async Task GenerateAsync_EnSpdx_QuandLaVersionEstInconnue_OmetVersionInfo()
    {
        using TestScope scope = new TestScope();

        await scope.SeedAsync(scope.NewOrganization());

        Project project = NewProject(scope.OrganizationId);
        project.Dependencies.Add(new Dependency
        {
            Name = "sans-version",
            CurrentVersion = string.Empty,
            Ecosystem = DependencyEcosystem.Npm
        });

        await scope.SeedAsync(project);

        SbomService sut = new(scope.Projects, scope.Organizations, new VulnerabilitySuppressionRepository(scope.Context));

        ExportResult? result = await sut.GenerateAsync(project.Id, scope.OrganizationId, SbomFormat.Spdx,
            CancellationToken.None);

        JsonElement package = Package(Parse(result!.Content).GetProperty("packages"), "sans-version");

        package.TryGetProperty("versionInfo", out _).Should().BeFalse();
        package.GetProperty("externalRefs").GetArrayLength().Should().Be(1);
        package.GetProperty("externalRefs")[0].GetProperty("referenceLocator").GetString()
            .Should().Be("pkg:npm/sans-version");
    }

    [Theory]
    [InlineData(DependencyEcosystem.Maven, "org.apache.logging.log4j:log4j-core", "2.14.1", "pkg:maven/org.apache.logging.log4j/log4j-core@2.14.1")]
    [InlineData(DependencyEcosystem.Npm, "@angular/core", "17.0.0", "pkg:npm/%40angular/core@17.0.0")]
    [InlineData(DependencyEcosystem.Composer, "Symfony/Console", "6.4.0", "pkg:composer/symfony/console@6.4.0")]
    [InlineData(DependencyEcosystem.Go, "github.com/gin-gonic/gin", "v1.9.1", "pkg:golang/github.com/gin-gonic/gin@v1.9.1")]
    [InlineData(DependencyEcosystem.PyPI, "Django_Rest.Framework", "3.15.0", "pkg:pypi/django-rest-framework@3.15.0")]
    public async Task GenerateAsync_EnCycloneDx_ConstruitDesPurlConformes(DependencyEcosystem ecosystem, string name,
        string version, string expectedPurl)
    {
        using TestScope scope = new TestScope();

        await scope.SeedAsync(scope.NewOrganization());

        Project project = NewProject(scope.OrganizationId);
        project.Dependencies.Add(new Dependency { Name = name, CurrentVersion = version, Ecosystem = ecosystem });

        await scope.SeedAsync(project);

        SbomService sut = new(scope.Projects, scope.Organizations, new VulnerabilitySuppressionRepository(scope.Context));

        ExportResult? result = await sut.GenerateAsync(project.Id, scope.OrganizationId, SbomFormat.CycloneDx,
            CancellationToken.None);

        Parse(result!.Content).GetProperty("components")[0].GetProperty("purl").GetString()
            .Should().Be(expectedPurl);
    }

    [Fact]
    public async Task GenerateAsync_QuandLaDependanceAUneLicence_LaReporteEnCycloneDxEtEnSpdx()
    {
        using TestScope scope = new TestScope();

        await scope.SeedAsync(scope.NewOrganization());

        Project project = NewProject(scope.OrganizationId);
        project.Dependencies.Add(new Dependency
        {
            Name = "left-pad",
            CurrentVersion = "1.3.0",
            Ecosystem = DependencyEcosystem.Npm,
            License = "MIT"
        });
        project.Dependencies.Add(new Dependency
        {
            Name = "obscure-lib",
            CurrentVersion = "0.1.0",
            Ecosystem = DependencyEcosystem.Npm,
            License = "Some Custom License"
        });

        await scope.SeedAsync(project);

        SbomService sut = new(scope.Projects, scope.Organizations, new VulnerabilitySuppressionRepository(scope.Context));

        ExportResult? cyclone = await sut.GenerateAsync(project.Id, scope.OrganizationId, SbomFormat.CycloneDx,
            CancellationToken.None);
        ExportResult? spdx = await sut.GenerateAsync(project.Id, scope.OrganizationId, SbomFormat.Spdx,
            CancellationToken.None);

        JsonElement components = Parse(cyclone!.Content).GetProperty("components");
        JsonElement mit = components.EnumerateArray().Single(c => c.GetProperty("name").GetString() == "left-pad");
        mit.GetProperty("licenses")[0].GetProperty("license").GetProperty("id").GetString().Should().Be("MIT");

        JsonElement custom = components.EnumerateArray().Single(c => c.GetProperty("name").GetString() == "obscure-lib");
        custom.GetProperty("licenses")[0].GetProperty("license").GetProperty("name").GetString()
            .Should().Be("Some Custom License");

        JsonElement packages = Parse(spdx!.Content).GetProperty("packages");
        Package(packages, "left-pad").GetProperty("licenseDeclared").GetString().Should().Be("MIT");
        Package(packages, "left-pad").GetProperty("licenseConcluded").GetString().Should().Be(NoAssertion);
        Package(packages, "Mon Projet").GetProperty("licenseDeclared").GetString().Should().Be(NoAssertion);
    }

    [Fact]
    public async Task GenerateAsync_EnVex_ReporteLesVulnerabilitesEtLeurAnalyse()
    {
        using TestScope scope = new TestScope();

        await scope.SeedAsync(scope.NewOrganization());

        Project project = NewProject(scope.OrganizationId);
        Dependency dependency = new Dependency
        {
            Name = "lodash",
            CurrentVersion = "4.17.15",
            Ecosystem = DependencyEcosystem.Npm
        };
        dependency.Vulnerabilities.Add(new Vulnerability
        {
            CveId = "GHSA-ignored",
            CveAlias = "CVE-2020-1",
            PackageName = "lodash",
            Severity = VulnerabilitySeverity.High,
            CvssScore = 7.5m
        });
        dependency.Vulnerabilities.Add(new Vulnerability
        {
            CveId = "GHSA-open",
            PackageName = "lodash",
            Severity = VulnerabilitySeverity.Critical,
            CvssScore = 9.8m,
            FixedVersion = "4.17.21"
        });
        project.Dependencies.Add(dependency);

        await scope.SeedAsync(project, new VulnerabilitySuppression
        {
            OrganizationId = scope.OrganizationId,
            ProjectId = project.Id,
            FindingKey = Sentinel.Domain.TechHealth.FindingKeys.ForVulnerability(DependencyEcosystem.Npm, "lodash",
                "GHSA-ignored"),
            Reason = SuppressionReason.NotAffected,
            Justification = "Code jamais appelé"
        });

        SbomService sut = new(scope.Projects, scope.Organizations, new VulnerabilitySuppressionRepository(scope.Context));

        ExportResult? result = await sut.GenerateAsync(project.Id, scope.OrganizationId, SbomFormat.Vex,
            CancellationToken.None);

        result!.FileName.Should().StartWith("vex-");
        JsonElement bom = Parse(result.Content);
        bom.TryGetProperty("components", out _).Should().BeFalse();

        JsonElement[] vulnerabilities = bom.GetProperty("vulnerabilities").EnumerateArray().ToArray();
        vulnerabilities.Should().HaveCount(2);

        JsonElement ignored = vulnerabilities.Single(v => v.GetProperty("id").GetString() == "CVE-2020-1");
        ignored.GetProperty("analysis").GetProperty("state").GetString().Should().Be("not_affected");
        ignored.GetProperty("affects")[0].GetProperty("ref").GetString().Should().Be("pkg:npm/lodash@4.17.15");

        JsonElement open = vulnerabilities.Single(v => v.GetProperty("id").GetString() == "GHSA-open");
        open.GetProperty("analysis").GetProperty("state").GetString().Should().Be("in_triage");
    }

    private static async Task<Project> SeedProjectAsync(TestScope scope)
    {
        await scope.SeedAsync(scope.NewOrganization());

        Project project = NewProject(scope.OrganizationId);

        project.Dependencies.Add(new Dependency
        {
            Name = "left-pad",
            CurrentVersion = "1.3.0",
            Ecosystem = DependencyEcosystem.Npm,
            Publisher = "npm, Inc."
        });

        project.Dependencies.Add(new Dependency
        {
            Name = "Serilog",
            CurrentVersion = "4.0.0",
            Ecosystem = DependencyEcosystem.NuGet
        });

        await scope.SeedAsync(project);

        return project;
    }

    private static Project NewProject(Guid organizationId) => new()
    {
        Id = Guid.NewGuid(),
        OrganizationId = organizationId,
        Name = "Mon Projet",
        RepositoryUrl = "https://github.com/ftel/sentinel",
        RepositoryType = RepositoryType.GitHub,
        ScanFrequency = ScanFrequency.Weekly
    };

    private static string? Supplier(JsonElement components, string name) =>
        components.EnumerateArray()
            .Single(component => component.GetProperty("name").GetString() == name)
            .GetProperty("supplier").GetProperty("name").GetString();

    private static JsonElement Package(JsonElement packages, string name) =>
        packages.EnumerateArray().Single(package => package.GetProperty("name").GetString() == name);

    private static JsonElement Parse(byte[] content) =>
        JsonDocument.Parse(Encoding.UTF8.GetString(content)).RootElement;
}
