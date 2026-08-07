using Sentinel.Application.Exports;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using CycloneDX.Json;
using CycloneDX.Models;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Dependency = Sentinel.Domain.Entities.Dependency;

namespace Sentinel.Application.TechHealth.ExportSbom;

public enum SbomFormat
{
    CycloneDx,
    Spdx
}

public class SbomService(IProjectRepository projectRepository, IOrganizationRepository organizationRepository)
{
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
        [DependencyEcosystem.Gradle] = "maven",
        [DependencyEcosystem.NuGet] = "nuget",
        [DependencyEcosystem.Go] = "golang",
        [DependencyEcosystem.Cargo] = "cargo",
        [DependencyEcosystem.Hex] = "hex",
        [DependencyEcosystem.Pub] = "pub",
        [DependencyEcosystem.Swift] = "swift",
    };

    private static readonly JsonSerializerOptions SpdxJsonOptions = new()
    {
        WriteIndented = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public async Task<ExportResult?> GenerateAsync(Guid projectId, Guid organizationId, SbomFormat format, CancellationToken cancellationToken)
    {
        Project? project = await projectRepository
            .GetOrDefaultInOrganizationWithDependenciesAsync(projectId, organizationId, cancellationToken);

        if (project == null) return null;

        List<Dependency> dependencies = project.Dependencies
            .OrderBy(d => d.Name)
            .ToList();

        Organization? organization = await organizationRepository.GetOrDefaultAsync(organizationId,
            QueryTracking.NoTracking, cancellationToken);

        string supplier = organization?.Name ?? ToolVendor;
        DateTime timestamp = DateTime.UtcNow;
        string slug = ExportFileName.Slugify(project.Name);

        return format == SbomFormat.CycloneDx
            ? BuildCycloneDx(project, dependencies, supplier, timestamp, slug)
            : BuildSpdx(project, dependencies, supplier, timestamp, slug);
    }

    private static ExportResult BuildCycloneDx(Project project, List<Dependency> dependencies, string supplier,
        DateTime timestamp, string slug)
    {
        Bom bom = new()
        {
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
            Components = dependencies.Select(ToCycloneComponent).ToList()
        };

        string rootRef = bom.Metadata.Component.BomRef;

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
            BomRef = purl ?? $"sentinel:dependency:{dependency.Id}"
        };
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
                LicenseDeclared = SpdxNoAssertion,
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

        string name = Uri.EscapeDataString(dependency.Name);
        return string.IsNullOrWhiteSpace(dependency.CurrentVersion)
            ? $"pkg:{type}/{name}"
            : $"pkg:{type}/{name}@{Uri.EscapeDataString(dependency.CurrentVersion)}";
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
