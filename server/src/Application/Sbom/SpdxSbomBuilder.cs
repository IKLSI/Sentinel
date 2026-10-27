using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Sentinel.Application.Exports;
using Sentinel.Domain.Entities;

namespace Sentinel.Application.Sbom;

internal static class SpdxSbomBuilder
{
    public const string NoAssertion = "NOASSERTION";

    private const string SpdxVersion = "SPDX-2.3";
    private const string DataLicense = "CC0-1.0";
    private const string DocumentSpdxId = "SPDXRef-DOCUMENT";
    private const string RootPackageSpdxId = "SPDXRef-RootPackage";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public static ExportResult Build(Project project, List<Dependency> dependencies, string supplier,
        DateTime timestamp, string slug)
    {
        List<SpdxPackage> packages = [RootPackage(project, supplier)];
        List<SpdxRelationship> relationships =
            [RelationshipOf(DocumentSpdxId, "DESCRIBES", RootPackageSpdxId)];

        for (int index = 0; index < dependencies.Count; index++)
        {
            string spdxId = $"SPDXRef-Package-{index + 1}";

            packages.Add(PackageOf(dependencies[index], spdxId));
            relationships.Add(RelationshipOf(RootPackageSpdxId, "DEPENDS_ON", spdxId));
        }

        SpdxDocument document = new()
        {
            SpdxVersion = SpdxVersion,
            DataLicense = DataLicense,
            SpdxId = DocumentSpdxId,
            Name = $"sentinel-{slug}-sbom",
            DocumentNamespace = $"https://sentinel.app/spdx/{project.Id}/{Guid.NewGuid()}",
            CreationInfo = new SpdxCreationInfo
            {
                Created = timestamp.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                Creators = new List<string> { $"Tool: {SbomService.ToolName}", $"Organization: {SbomService.ToolVendor}" }
            },
            DocumentDescribes = [RootPackageSpdxId],
            Packages = packages,
            Relationships = relationships
        };

        string json = JsonSerializer.Serialize(document, JsonOptions);
        return new ExportResult(Encoding.UTF8.GetBytes(json), $"sbom-{slug}-spdx.json");
    }

    private static SpdxPackage RootPackage(Project project, string supplier) => new()
    {
        Name = project.Name,
        SpdxId = RootPackageSpdxId,
        DownloadLocation = string.IsNullOrWhiteSpace(project.RepositoryUrl)
            ? NoAssertion
            : project.RepositoryUrl,
        FilesAnalyzed = false,
        Supplier = Organization(supplier),
        LicenseConcluded = NoAssertion,
        LicenseDeclared = NoAssertion,
        CopyrightText = NoAssertion
    };

    private static SpdxPackage PackageOf(Dependency dependency, string spdxId)
    {
        string? purl = SbomService.PackageUrlOf(dependency);

        return new SpdxPackage
        {
            Name = dependency.Name,
            SpdxId = spdxId,
            VersionInfo = string.IsNullOrWhiteSpace(dependency.CurrentVersion) ? null : dependency.CurrentVersion,
            DownloadLocation = NoAssertion,
            FilesAnalyzed = false,
            Supplier = string.IsNullOrWhiteSpace(dependency.Publisher)
                ? NoAssertion
                : Organization(dependency.Publisher),
            LicenseConcluded = NoAssertion,
            LicenseDeclared = string.IsNullOrWhiteSpace(dependency.License)
                ? NoAssertion
                : SpdxLicense.ExpressionOf(dependency.License) ?? NoAssertion,
            CopyrightText = NoAssertion,
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
        };
    }

    private static SpdxRelationship RelationshipOf(string elementId, string relationshipType,
        string relatedElementId) => new()
    {
        SpdxElementId = elementId,
        RelationshipType = relationshipType,
        RelatedSpdxElement = relatedElementId
    };

    private static string Organization(string name) => $"Organization: {name}";

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
