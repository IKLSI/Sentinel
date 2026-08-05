using Sentinel.Domain.Entities;

namespace Sentinel.Application.TechHealth;

public static class ProjectMapper
{
    public static ProjectDto ToDto(Project project) => new()
    {
        Id = project.Id,
        Name = project.Name,
        RepositoryUrl = project.RepositoryUrl,
        RepositoryType = project.RepositoryType.ToString(),
        LastScanAt = project.LastScanAt,
        HealthScore = project.HealthScore,
        HealthGrade = project.HealthGrade,
        Coverage = project.Coverage.ToString(),
        ScanFrequency = project.ScanFrequency.ToString(),
        TotalDependencies = project.Dependencies?.Count ?? 0,
        VulnerableDependencies = project.Dependencies?
            .Count(dependency => dependency.Status == DependencyStatus.Vulnerable) ?? 0,
        CriticalVulnerabilities = project.Dependencies?
            .SelectMany(dependency => dependency.Vulnerabilities)
            .Count(vulnerability => vulnerability.Severity == VulnerabilitySeverity.Critical) ?? 0,
        TotalVulnerabilities = project.Dependencies?
            .SelectMany(dependency => dependency.Vulnerabilities)
            .Count() ?? 0,
        Dependencies = project.Dependencies?.Select(ToDto).ToList() ?? [],
        Runtimes = project.Runtimes?.Select(ToDto).ToList() ?? []
    };

    private static DependencyDto ToDto(Dependency dependency) => new()
    {
        Id = dependency.Id,
        Name = dependency.Name,
        CurrentVersion = dependency.CurrentVersion,
        LatestVersion = dependency.LatestVersion,
        Type = dependency.Type.ToString(),
        Ecosystem = dependency.Ecosystem.ToString(),
        Status = dependency.Status.ToString(),
        Vulnerabilities = dependency.Vulnerabilities.Select(ToDto).ToList()
    };

    private static VulnerabilityDto ToDto(Vulnerability vulnerability) => new()
    {
        Id = vulnerability.Id,
        CveId = vulnerability.CveId,
        CveAlias = vulnerability.CveAlias,
        CvssScore = vulnerability.CvssScore,
        Description = vulnerability.Description,
        Severity = vulnerability.Severity.ToString(),
        FixedVersion = vulnerability.FixedVersion
    };

    private static RuntimeDto ToDto(Runtime runtime) => new()
    {
        Id = runtime.Id,
        Name = runtime.Name,
        Version = runtime.Version,
        EolDate = runtime.EolDate,
        IsEol = runtime.IsEol
    };
}
