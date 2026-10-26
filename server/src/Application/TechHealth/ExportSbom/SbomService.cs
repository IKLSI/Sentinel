using Sentinel.Application.Exports;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using CycloneDX;
using CycloneDX.Json;
using CycloneDX.Models;
using CycloneDX.Models.Vulnerabilities;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.TechHealth;
using Dependency = Sentinel.Domain.Entities.Dependency;
using Vulnerability = Sentinel.Domain.Entities.Vulnerability;
using CycloneVulnerability = CycloneDX.Models.Vulnerabilities.Vulnerability;

namespace Sentinel.Application.TechHealth.ExportSbom;

public enum SbomFormat
{
    CycloneDx,
    Spdx,
    Vex
}

public class SbomService(
    IProjectRepository projectRepository,
    IOrganizationRepository organizationRepository,
    IVulnerabilitySuppressionRepository suppressionRepository)
{
    private const string OsvSourceName = "OSV";
    private const string OsvAdvisoryUrl = "https://osv.dev/vulnerability/";

    private const string ToolVendor = "Sentinel";
    private const string ToolName = "Sentinel Tech-Health";
    private const string SpdxVersion = "SPDX-2.3";
    private const string SpdxDataLicense = "CC0-1.0";
    private const string SpdxNoAssertion = "NOASSERTION";
    private const string DocumentSpdxId = "SPDXRef-DOCUMENT";
    private const string RootPackageSpdxId = "SPDXRef-RootPackage";

    private static readonly Dictionary<DependencyEcosystem, string> PurlTypes = new()
    {
        [DependencyEcosystem.Npm] = "npm",
        [DependencyEcosystem.PyPI] = "pypi",
        [DependencyEcosystem.Composer] = "composer",
        [DependencyEcosystem.Gem] = "gem",
        [DependencyEcosystem.Maven] = "maven",
        [DependencyEcosystem.NuGet] = "nuget",
        [DependencyEcosystem.Go] = "golang",
        [DependencyEcosystem.Cargo] = "cargo",
        [DependencyEcosystem.Hex] = "hex",
        [DependencyEcosystem.Pub] = "pub",
        [DependencyEcosystem.Swift] = "swift",
        [DependencyEcosystem.CocoaPods] = "cocoapods",
        [DependencyEcosystem.GitHubActions] = "githubactions",
    };

    private static readonly JsonSerializerOptions SpdxJsonOptions = new()
    {
        WriteIndented = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public async Task<ExportResult?> GenerateAsync(Guid projectId, Guid organizationId, SbomFormat format, CancellationToken cancellationToken)
    {
        Project? project = await projectRepository
            .GetOrDefaultInOrganizationWithHealthDetailsAsync(projectId, organizationId, cancellationToken);

        if (project == null) return null;

        List<Dependency> dependencies = project.Dependencies
            .OrderBy(d => d.Name)
            .ToList();

        Organization? organization = await organizationRepository.GetOrDefaultAsync(organizationId,
            QueryTracking.NoTracking, cancellationToken);

        string supplier = organization?.Name ?? ToolVendor;
        DateTime timestamp = DateTime.UtcNow;
        string slug = ExportFileName.Slugify(project.Name);

        if (format == SbomFormat.Spdx) return BuildSpdx(project, dependencies, supplier, timestamp, slug);

        IReadOnlyList<VulnerabilitySuppression> suppressions = await suppressionRepository
            .ListActiveByProjectAsync(projectId, timestamp, cancellationToken);
        Dictionary<string, VulnerabilitySuppression> suppressionsByKey = suppressions
            .ToDictionary(suppression => suppression.FindingKey);

        return BuildCycloneDx(project, dependencies, suppressionsByKey, supplier, timestamp, slug,
            format == SbomFormat.Vex);
    }

    private static ExportResult BuildCycloneDx(Project project, List<Dependency> dependencies,
        Dictionary<string, VulnerabilitySuppression> suppressionsByKey, string supplier, DateTime timestamp,
        string slug, bool vexOnly)
    {
        Bom bom = new()
        {
            SpecVersion = SpecificationVersion.v1_6,
            SerialNumber = $"urn:uuid:{Guid.NewGuid()}",
            Version = 1,
            Metadata = new Metadata
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
                            Name = ToolName,
                            Publisher = ToolVendor,
                            Supplier = new OrganizationalEntity { Name = ToolVendor }
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
            },
            Components = dependencies.Select(ToCycloneComponent).DistinctBy(component => component.BomRef).ToList()
        };

        string rootRef = bom.Metadata.Component.BomRef;

        bom.Vulnerabilities = BuildVulnerabilities(dependencies, suppressionsByKey);

        if (vexOnly)
        {
            bom.Components = null;
            string vexJson = Serializer.Serialize(bom);
            return new ExportResult(Encoding.UTF8.GetBytes(vexJson), $"vex-{slug}-cyclonedx.json");
        }

        bom.Dependencies =
        [
            new CycloneDX.Models.Dependency
            {
                Ref = rootRef,
                Dependencies = bom.Components
                    .Select(component => new CycloneDX.Models.Dependency { Ref = component.BomRef })
                    .ToList()
            }
        ];

        string json = Serializer.Serialize(bom);
        return new ExportResult(Encoding.UTF8.GetBytes(json), $"sbom-{slug}-cyclonedx.json");
    }

    private static List<CycloneVulnerability> BuildVulnerabilities(List<Dependency> dependencies,
        Dictionary<string, VulnerabilitySuppression> suppressionsByKey) =>
        dependencies
            .SelectMany(dependency => dependency.Vulnerabilities.Select(vulnerability =>
                ToCycloneVulnerability(dependency, vulnerability, suppressionsByKey)))
            .ToList();

    private static CycloneVulnerability ToCycloneVulnerability(Dependency dependency, Vulnerability vulnerability,
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
                    Severity = CycloneSeverity(vulnerability.Severity),
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

    private static Severity CycloneSeverity(VulnerabilitySeverity severity) => severity switch
    {
        VulnerabilitySeverity.Critical => Severity.Critical,
        VulnerabilitySeverity.High => Severity.High,
        VulnerabilitySeverity.Medium => Severity.Medium,
        _ => Severity.Low
    };

    private static string ComponentRef(Dependency dependency) =>
        BuildPurl(dependency) ?? $"sentinel:dependency:{dependency.Id}";

    private static Component ToCycloneComponent(Dependency dependency)
    {
        string? purl = BuildPurl(dependency);
        string publisher = PublisherOrNoAssertion(dependency);

        return new Component
        {
            Type = Component.Classification.Library,
            Name = dependency.Name,
            Version = dependency.CurrentVersion,
            Publisher = publisher,
            Supplier = new OrganizationalEntity { Name = publisher },
            Purl = purl,
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
        string.IsNullOrWhiteSpace(dependency.Publisher) ? SpdxNoAssertion : dependency.Publisher;

    private static ExportResult BuildSpdx(Project project, List<Dependency> dependencies, string supplier,
        DateTime timestamp, string slug)
    {
        List<SpdxPackage> packages =
        [
            new()
            {
                Name = project.Name,
                SpdxId = RootPackageSpdxId,
                DownloadLocation = string.IsNullOrWhiteSpace(project.RepositoryUrl)
                    ? SpdxNoAssertion
                    : project.RepositoryUrl,
                FilesAnalyzed = false,
                Supplier = SpdxOrganization(supplier),
                LicenseConcluded = SpdxNoAssertion,
                LicenseDeclared = SpdxNoAssertion,
                CopyrightText = SpdxNoAssertion
            }
        ];

        List<SpdxRelationship> relationships =
        [
            new()
            {
                SpdxElementId = DocumentSpdxId,
                RelationshipType = "DESCRIBES",
                RelatedSpdxElement = RootPackageSpdxId
            }
        ];

        for (int i = 0; i < dependencies.Count; i++)
        {
            Dependency dependency = dependencies[i];
            string spdxId = $"SPDXRef-Package-{i + 1}";
            string? purl = BuildPurl(dependency);

            packages.Add(new SpdxPackage
            {
                Name = dependency.Name,
                SpdxId = spdxId,
                VersionInfo = string.IsNullOrWhiteSpace(dependency.CurrentVersion) ? null : dependency.CurrentVersion,
                DownloadLocation = SpdxNoAssertion,
                FilesAnalyzed = false,
                Supplier = string.IsNullOrWhiteSpace(dependency.Publisher)
                    ? SpdxNoAssertion
                    : SpdxOrganization(dependency.Publisher),
                LicenseConcluded = SpdxNoAssertion,
                LicenseDeclared = string.IsNullOrWhiteSpace(dependency.License)
                    ? SpdxNoAssertion
                    : SpdxLicense.ExpressionOf(dependency.License) ?? SpdxNoAssertion,
                CopyrightText = SpdxNoAssertion,
                ExternalRefs = purl == null
                    ? null
                    : new List<SpdxExternalRef>
                    {
                        new()
                        {
                            ReferenceCategory = "PACKAGE-MANAGER",
                            ReferenceType = "purl",
                            ReferenceLocator = purl
                        }
                    }
            });

            relationships.Add(new SpdxRelationship
            {
                SpdxElementId = RootPackageSpdxId,
                RelationshipType = "DEPENDS_ON",
                RelatedSpdxElement = spdxId
            });
        }

        SpdxDocument document = new()
        {
            SpdxVersion = SpdxVersion,
            DataLicense = SpdxDataLicense,
            SpdxId = DocumentSpdxId,
            Name = $"sentinel-{slug}-sbom",
            DocumentNamespace = $"https://sentinel.app/spdx/{project.Id}/{Guid.NewGuid()}",
            CreationInfo = new SpdxCreationInfo
            {
                Created = timestamp.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                Creators = new List<string> { $"Tool: {ToolName}", $"Organization: {ToolVendor}" }
            },
            DocumentDescribes = [RootPackageSpdxId],
            Packages = packages,
            Relationships = relationships
        };

        string json = JsonSerializer.Serialize(document, SpdxJsonOptions);
        return new ExportResult(Encoding.UTF8.GetBytes(json), $"sbom-{slug}-spdx.json");
    }

    private static string SpdxOrganization(string name) => $"Organization: {name}";

    private static string? BuildPurl(Dependency dependency)
    {
        if (!PurlTypes.TryGetValue(dependency.Ecosystem, out string? type)) return null;
        if (string.IsNullOrWhiteSpace(dependency.Name)) return null;

        string path = string.Join('/', PurlPathSegments(dependency).Select(Uri.EscapeDataString));

        return string.IsNullOrWhiteSpace(dependency.CurrentVersion)
            ? $"pkg:{type}/{path}"
            : $"pkg:{type}/{path}@{Uri.EscapeDataString(dependency.CurrentVersion)}";
    }

    private static IEnumerable<string> PurlPathSegments(Dependency dependency)
    {
        string name = dependency.Name.Trim();

        return dependency.Ecosystem switch
        {
            DependencyEcosystem.Maven => name.Split(':', 2),
            DependencyEcosystem.PyPI => [name.ToLowerInvariant().Replace('_', '-').Replace('.', '-')],
            DependencyEcosystem.Composer => name.ToLowerInvariant().Split('/'),
            _ => name.Split('/', StringSplitOptions.RemoveEmptyEntries)
        };
    }

    private sealed class SpdxDocument
    {
        [JsonPropertyName("spdxVersion")] public string SpdxVersion { get; set; } = string.Empty;
        [JsonPropertyName("dataLicense")] public string DataLicense { get; set; } = string.Empty;
        [JsonPropertyName("SPDXID")] public string SpdxId { get; set; } = string.Empty;
        [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
        [JsonPropertyName("documentNamespace")] public string DocumentNamespace { get; set; } = string.Empty;
        [JsonPropertyName("creationInfo")] public SpdxCreationInfo CreationInfo { get; set; } = new();
        [JsonPropertyName("documentDescribes")] public List<string> DocumentDescribes { get; set; } = new();
        [JsonPropertyName("packages")] public List<SpdxPackage> Packages { get; set; } = new();
        [JsonPropertyName("relationships")] public List<SpdxRelationship> Relationships { get; set; } = new();
    }

    private sealed class SpdxCreationInfo
    {
        [JsonPropertyName("created")] public string Created { get; set; } = string.Empty;
        [JsonPropertyName("creators")] public List<string> Creators { get; set; } = new();
    }

    private sealed class SpdxPackage
    {
        [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
        [JsonPropertyName("SPDXID")] public string SpdxId { get; set; } = string.Empty;
        [JsonPropertyName("versionInfo")] public string? VersionInfo { get; set; }
        [JsonPropertyName("downloadLocation")] public string DownloadLocation { get; set; } = string.Empty;
        [JsonPropertyName("filesAnalyzed")] public bool FilesAnalyzed { get; set; }
        [JsonPropertyName("supplier")] public string Supplier { get; set; } = string.Empty;
        [JsonPropertyName("licenseConcluded")] public string LicenseConcluded { get; set; } = string.Empty;
        [JsonPropertyName("licenseDeclared")] public string LicenseDeclared { get; set; } = string.Empty;
        [JsonPropertyName("copyrightText")] public string CopyrightText { get; set; } = string.Empty;
        [JsonPropertyName("externalRefs")] public List<SpdxExternalRef>? ExternalRefs { get; set; }
    }

    private sealed class SpdxExternalRef
    {
        [JsonPropertyName("referenceCategory")] public string ReferenceCategory { get; set; } = string.Empty;
        [JsonPropertyName("referenceType")] public string ReferenceType { get; set; } = string.Empty;
        [JsonPropertyName("referenceLocator")] public string ReferenceLocator { get; set; } = string.Empty;
    }

    private sealed class SpdxRelationship
    {
        [JsonPropertyName("spdxElementId")] public string SpdxElementId { get; set; } = string.Empty;
        [JsonPropertyName("relationshipType")] public string RelationshipType { get; set; } = string.Empty;
        [JsonPropertyName("relatedSpdxElement")] public string RelatedSpdxElement { get; set; } = string.Empty;
    }
}
