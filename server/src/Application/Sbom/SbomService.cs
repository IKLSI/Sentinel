using Sentinel.Application.Exports;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Sbom;

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
    internal const string ToolVendor = "Sentinel";
    internal const string ToolName = "Sentinel Tech-Health";

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

        if (format == SbomFormat.Spdx) return SpdxSbomBuilder.Build(project, dependencies, supplier, timestamp, slug);

        IReadOnlyList<VulnerabilitySuppression> suppressions = await suppressionRepository
            .ListActiveByProjectAsync(projectId, timestamp, cancellationToken);
        Dictionary<string, VulnerabilitySuppression> suppressionsByKey = suppressions
            .ToDictionary(suppression => suppression.FindingKey);

        return CycloneDxSbomBuilder.Build(project, dependencies, suppressionsByKey, supplier, timestamp, slug,
            format == SbomFormat.Vex);
    }

    internal static string? PackageUrlOf(Dependency dependency)
    {
        if (!PurlTypes.TryGetValue(dependency.Ecosystem, out string? type)) return null;
        if (string.IsNullOrWhiteSpace(dependency.Name)) return null;

        string path = string.Join('/', PackageUrlPathSegments(dependency).Select(Uri.EscapeDataString));

        return string.IsNullOrWhiteSpace(dependency.CurrentVersion)
            ? $"pkg:{type}/{path}"
            : $"pkg:{type}/{path}@{Uri.EscapeDataString(dependency.CurrentVersion)}";
    }

    private static IEnumerable<string> PackageUrlPathSegments(Dependency dependency)
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
}
