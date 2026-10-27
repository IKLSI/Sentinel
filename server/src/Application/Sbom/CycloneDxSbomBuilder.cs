using System.Text;
using CycloneDX;
using CycloneDX.Json;
using CycloneDX.Models;
using CycloneDX.Models.Vulnerabilities;
using Sentinel.Application.Exports;
using Sentinel.Domain.Entities;
using Sentinel.Domain.TechHealth;
using Dependency = Sentinel.Domain.Entities.Dependency;
using Vulnerability = Sentinel.Domain.Entities.Vulnerability;
using CycloneVulnerability = CycloneDX.Models.Vulnerabilities.Vulnerability;

namespace Sentinel.Application.Sbom;

internal static class CycloneDxSbomBuilder
{
    private const string OsvSourceName = "OSV";
    private const string OsvAdvisoryUrl = "https://osv.dev/vulnerability/";

    public static ExportResult Build(Project project, List<Dependency> dependencies,
        Dictionary<string, VulnerabilitySuppression> suppressionsByKey, string supplier, DateTime timestamp,
        string slug, bool vexOnly)
    {
        Bom bom = new()
        {
            SpecVersion = SpecificationVersion.v1_6,
            SerialNumber = $"urn:uuid:{Guid.NewGuid()}",
            Version = 1,
            Metadata = BuildMetadata(project, supplier, timestamp),
            Components = dependencies.Select(ToComponent).DistinctBy(component => component.BomRef).ToList(),
            Vulnerabilities = BuildVulnerabilities(dependencies, suppressionsByKey)
        };

        if (vexOnly)
        {
            bom.Components = null;
            return Serialize(bom, $"vex-{slug}-cyclonedx.json");
        }

        bom.Dependencies =
        [
            new CycloneDX.Models.Dependency
            {
                Ref = bom.Metadata.Component.BomRef,
                Dependencies = bom.Components
                    .Select(component => new CycloneDX.Models.Dependency { Ref = component.BomRef })
                    .ToList()
            }
        ];

        return Serialize(bom, $"sbom-{slug}-cyclonedx.json");
    }

    private static ExportResult Serialize(Bom bom, string fileName) =>
        new(Encoding.UTF8.GetBytes(Serializer.Serialize(bom)), fileName);

    private static Metadata BuildMetadata(Project project, string supplier, DateTime timestamp) => new()
    {
        Timestamp = timestamp,
        Supplier = new OrganizationalEntity { Name = supplier },
        Authors = [new OrganizationalContact { Name = supplier }],
        Tools = new ToolChoices
        {
            Components =
            [
                new Component
                {
                    Type = Component.Classification.Application,
                    Name = SbomService.ToolName,
                    Publisher = SbomService.ToolVendor,
                    Supplier = new OrganizationalEntity { Name = SbomService.ToolVendor }
                }
            ]
        },
        Component = new Component
        {
            Type = Component.Classification.Application,
            Name = project.Name,
            Publisher = supplier,
            Supplier = new OrganizationalEntity { Name = supplier },
            BomRef = $"sentinel:project:{project.Id}"
        }
    };

    private static List<CycloneVulnerability> BuildVulnerabilities(List<Dependency> dependencies,
        Dictionary<string, VulnerabilitySuppression> suppressionsByKey) =>
        dependencies
            .SelectMany(dependency => dependency.Vulnerabilities.Select(vulnerability =>
                ToVulnerability(dependency, vulnerability, suppressionsByKey)))
            .ToList();

    private static CycloneVulnerability ToVulnerability(Dependency dependency, Vulnerability vulnerability,
        Dictionary<string, VulnerabilitySuppression> suppressionsByKey)
    {
        string findingKey = FindingKeys.ForVulnerability(dependency, vulnerability);

        return new CycloneVulnerability
        {
            BomRef = $"sentinel:vulnerability:{vulnerability.Id}",
            Id = VulnerabilityIdentity.Of(vulnerability),
            Source = new Source { Name = OsvSourceName, Url = OsvAdvisoryUrl + vulnerability.CveId },
            Description = string.IsNullOrWhiteSpace(vulnerability.Description) ? null : vulnerability.Description,
            Recommendation = vulnerability.FixedVersion == null ? null : $"Upgrade to {vulnerability.FixedVersion}",
            Ratings =
            [
                new Rating
                {
                    Score = (double)vulnerability.CvssScore,
                    Severity = SeverityOf(vulnerability.Severity),
                    Method = ScoreMethod.Other
                }
            ],
            Affects = [new Affects { Ref = ComponentRef(dependency) }],
            Analysis = suppressionsByKey.TryGetValue(findingKey, out VulnerabilitySuppression? suppression)
                ? AnalysisOf(suppression)
                : new Analysis { State = ImpactAnalysisState.In_Triage }
        };
    }

    private static Analysis AnalysisOf(VulnerabilitySuppression suppression) => suppression.Reason switch
    {
        SuppressionReason.NotAffected => new Analysis
        {
            State = ImpactAnalysisState.Not_Affected
        },
        SuppressionReason.FalsePositive => new Analysis
        {
            State = ImpactAnalysisState.False_Positive
        },
        _ => new Analysis
        {
            State = ImpactAnalysisState.Exploitable,
            Response = [Response.Will_Not_Fix]
        }
    };

    private static Severity SeverityOf(VulnerabilitySeverity severity) => severity switch
    {
        VulnerabilitySeverity.Critical => Severity.Critical,
        VulnerabilitySeverity.High => Severity.High,
        VulnerabilitySeverity.Medium => Severity.Medium,
        _ => Severity.Low
    };

    private static string ComponentRef(Dependency dependency) =>
        SbomService.PackageUrlOf(dependency) ?? $"sentinel:dependency:{dependency.Id}";

    private static Component ToComponent(Dependency dependency)
    {
        string publisher = PublisherOrNoAssertion(dependency);

        return new Component
        {
            Type = Component.Classification.Library,
            Name = dependency.Name,
            Version = dependency.CurrentVersion,
            Publisher = publisher,
            Supplier = new OrganizationalEntity { Name = publisher },
            Purl = SbomService.PackageUrlOf(dependency),
            BomRef = ComponentRef(dependency),
            Licenses = string.IsNullOrWhiteSpace(dependency.License)
                ? null
                : new List<LicenseChoice> { BuildLicenseChoice(dependency.License) }
        };
    }

    private static LicenseChoice BuildLicenseChoice(string license)
    {
        if (SpdxLicense.IdOf(license) is { } id) return new LicenseChoice { License = new License { Id = id } };

        return SpdxLicense.ExpressionOf(license) is { } expression
            ? new LicenseChoice { Expression = expression }
            : new LicenseChoice { License = new License { Name = license } };
    }

    private static string PublisherOrNoAssertion(Dependency dependency) =>
        string.IsNullOrWhiteSpace(dependency.Publisher) ? SpdxSbomBuilder.NoAssertion : dependency.Publisher;
}
