using Sentinel.Domain.Entities;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Tests.Helpers;

public sealed class ProjectGraphBuilder
{
    private readonly Project _project;

    public ProjectGraphBuilder(string name = "Projet")
    {
        _project = new Project
        {
            Id = Guid.NewGuid(),
            OrganizationId = Guid.NewGuid(),
            Name = name,
            RepositoryType = RepositoryType.GitHub,
            ScanFrequency = ScanFrequency.Weekly,
            Coverage = ScanCoverage.Covered,
            Dependencies = new List<Dependency>(),
            Runtimes = new List<Runtime>(),
        };
    }

    public ProjectGraphBuilder InOrganization(Guid organizationId)
    {
        _project.OrganizationId = organizationId;
        return this;
    }

    public ProjectGraphBuilder WithScanError(string errorCode)
    {
        _project.LastScanError = errorCode;
        return this;
    }

    public ProjectGraphBuilder WithDependency(string name, DependencyStatus status = DependencyStatus.UpToDate,
        DependencyType type = DependencyType.Prod, bool isDirect = true, string latestVersion = "1.0.0",
        DependencyEcosystem ecosystem = DependencyEcosystem.Npm)
    {
        _project.Dependencies.Add(new Dependency
        {
            ProjectId = _project.Id,
            Project = _project,
            Name = name,
            CurrentVersion = "1.0.0",
            LatestVersion = latestVersion,
            Status = status,
            Type = type,
            IsDirect = isDirect,
            Ecosystem = ecosystem,
        });
        return this;
    }

    public ProjectGraphBuilder WithVulnerability(string dependencyName, string cveId,
        VulnerabilitySeverity severity = VulnerabilitySeverity.High, decimal cvssScore = 7.5m,
        string? fixedVersion = "1.0.1", bool isKnownExploited = false, decimal? epssScore = null)
    {
        Dependency dependency = _project.Dependencies.Single(d => d.Name == dependencyName);

        dependency.Vulnerabilities.Add(new Vulnerability
        {
            DependencyId = dependency.Id,
            Dependency = dependency,
            CveId = cveId,
            PackageName = dependencyName,
            Severity = severity,
            CvssScore = cvssScore,
            FixedVersion = fixedVersion,
            IsKnownExploited = isKnownExploited,
            EpssScore = epssScore,
            DetectedAt = DateTime.UtcNow,
        });
        return this;
    }

    public ProjectGraphBuilder WithRuntime(string name, string version, DateTime? eolDate, bool? isEol = null)
    {
        _project.Runtimes.Add(new Runtime
        {
            ProjectId = _project.Id,
            Project = _project,
            Name = name,
            Version = version,
            EolDate = eolDate,
            IsEol = isEol,
        });
        return this;
    }

    public Project Build()
    {
        int score = HealthScoreCalculator.Calculate(_project);
        _project.HealthScore = score;
        _project.HealthGrade = HealthScoreCalculator.ToGrade(score);
        return _project;
    }

    public Project BuildUnscored() => _project;
}
