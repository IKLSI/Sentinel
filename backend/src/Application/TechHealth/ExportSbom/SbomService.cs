using Sentinel.Application.Exports;
using Sentinel.Application.Security;
using Sentinel.Application.TechHealth.Scan;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using CycloneDX.Json;
using CycloneDX.Models;
using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Dependency = Sentinel.Domain.Models.Dependency;

namespace Sentinel.Application.TechHealth.ExportSbom;

public enum SbomFormat
{
    CycloneDx,
    Spdx
}

public class SbomService(IProjectRepository projectRepository)
{
    private const string ToolVendor = "Sentinel";
    private const string ToolName = "Sentinel Tech-Health";
    private const string SpdxVersion = "SPDX-2.3";
    private const string SpdxDataLicense = "CC0-1.0";
    private const string SpdxNoAssertion = "NOASSERTION";

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
        Project? project = await projectRepository.GetOrDefaultInOrganizationAsync(projectId, organizationId,
            new SingleEntityQueryOptions<Project>
            {
                AsNoTracking = true,
                AsSplitQuery = true,
                Include = query => query.Include(p => p.Dependencies)
            },
            cancellationToken);

        if (project == null) return null;

        List<Dependency> dependencies = project.Dependencies
            .OrderBy(d => d.Name)
            .ToList();

        DateTime timestamp = DateTime.UtcNow;
        string slug = Slugify(project.Name);

        return format == SbomFormat.CycloneDx
            ? BuildCycloneDx(project, dependencies, timestamp, slug)
            : BuildSpdx(project, dependencies, timestamp, slug);
    }

    private static ExportResult BuildCycloneDx(Project project, List<Dependency> dependencies, DateTime timestamp, string slug)
    {
        Bom bom = new()
        {
            SerialNumber = $"urn:uuid:{Guid.NewGuid()}",
            Version = 1,
            Metadata = new Metadata
            {
                Timestamp = timestamp,
                Component = new Component
                {
                    Type = Component.Classification.Application,
                    Name = project.Name,
                    BomRef = $"sentinel:project:{project.Id}"
                }
            },
            Components = dependencies.Select(ToCycloneComponent).ToList()
        };

        string json = Serializer.Serialize(bom);
        return new ExportResult(Encoding.UTF8.GetBytes(json), $"sbom-{slug}-cyclonedx.json");
    }

    private static Component ToCycloneComponent(Dependency dependency)
    {
        string? purl = BuildPurl(dependency);

        return new Component
        {
            Type = Component.Classification.Library,
            Name = dependency.Name,
            Version = dependency.CurrentVersion,
            Purl = purl,
            BomRef = purl ?? $"sentinel:dependency:{dependency.Id}"
        };
    }

    private static ExportResult BuildSpdx(Project project, List<Dependency> dependencies, DateTime timestamp, string slug)
    {
        List<SpdxPackage> packages = new();
        List<SpdxRelationship> relationships = new();

        for (int i = 0; i < dependencies.Count; i++)
        {
            Dependency dependency = dependencies[i];
            string spdxId = $"SPDXRef-Package-{i + 1}";
            string? purl = BuildPurl(dependency);

            packages.Add(new SpdxPackage
            {
                Name = dependency.Name,
                SpdxId = spdxId,
                VersionInfo = dependency.CurrentVersion,
                DownloadLocation = SpdxNoAssertion,
                FilesAnalyzed = false,
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
                SpdxElementId = "SPDXRef-DOCUMENT",
                RelationshipType = "DESCRIBES",
                RelatedSpdxElement = spdxId
            });
        }

        SpdxDocument document = new()
        {
            SpdxVersion = SpdxVersion,
            DataLicense = SpdxDataLicense,
            SpdxId = "SPDXRef-DOCUMENT",
            Name = $"sentinel-{slug}-sbom",
            DocumentNamespace = $"https://sentinel.app/spdx/{project.Id}/{Guid.NewGuid()}",
            CreationInfo = new SpdxCreationInfo
            {
                Created = timestamp.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                Creators = new List<string> { $"Tool: {ToolName}", $"Organization: {ToolVendor}" }
            },
            Packages = packages,
            Relationships = relationships
        };

        string json = JsonSerializer.Serialize(document, SpdxJsonOptions);
        return new ExportResult(Encoding.UTF8.GetBytes(json), $"sbom-{slug}-spdx.json");
    }

    private static string? BuildPurl(Dependency dependency)
    {
        if (!PurlTypes.TryGetValue(dependency.Ecosystem, out string? type)) return null;
        if (string.IsNullOrWhiteSpace(dependency.Name)) return null;

        string name = Uri.EscapeDataString(dependency.Name);
        return string.IsNullOrWhiteSpace(dependency.CurrentVersion)
            ? $"pkg:{type}/{name}"
            : $"pkg:{type}/{name}@{Uri.EscapeDataString(dependency.CurrentVersion)}";
    }

    private static string Slugify(string value)
    {
        StringBuilder builder = new(value.Length);

        foreach (char c in value.ToLowerInvariant())
        {
            if (char.IsLetterOrDigit(c)) builder.Append(c);
            else if (c is ' ' or '-' or '_' or '.') builder.Append('-');
        }

        string slug = builder.ToString().Trim('-');
        return string.IsNullOrEmpty(slug) ? "projet" : slug;
    }

    private sealed class SpdxDocument
    {
        [JsonPropertyName("spdxVersion")] public string SpdxVersion { get; set; } = string.Empty;
        [JsonPropertyName("dataLicense")] public string DataLicense { get; set; } = string.Empty;
        [JsonPropertyName("SPDXID")] public string SpdxId { get; set; } = string.Empty;
        [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
        [JsonPropertyName("documentNamespace")] public string DocumentNamespace { get; set; } = string.Empty;
        [JsonPropertyName("creationInfo")] public SpdxCreationInfo CreationInfo { get; set; } = new();
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
        [JsonPropertyName("versionInfo")] public string VersionInfo { get; set; } = string.Empty;
        [JsonPropertyName("downloadLocation")] public string DownloadLocation { get; set; } = string.Empty;
        [JsonPropertyName("filesAnalyzed")] public bool FilesAnalyzed { get; set; }
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
