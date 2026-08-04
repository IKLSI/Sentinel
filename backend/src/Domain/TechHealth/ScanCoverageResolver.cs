using Sentinel.Domain.Models;

namespace Sentinel.Domain.TechHealth;

public static class ScanCoverageResolver
{
    public static ScanCoverage Resolve(Project project, bool scanRan, string? scanError, int manifestsRead)
    {
        if (project.Dependencies.Any() || project.Runtimes.Any()) return ScanCoverage.Covered;
        if (!scanRan) return ScanCoverage.NotScanned;
        if (scanError != null) return ScanCoverage.Failed;

        return manifestsRead == 0 ? ScanCoverage.NoManifest : ScanCoverage.NoDependencies;
    }
}
