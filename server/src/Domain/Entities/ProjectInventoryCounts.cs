using Sentinel.Domain.TechHealth;

namespace Sentinel.Domain.Entities;

public class ProjectInventoryCounts
{
    public int Dependencies { get; set; }
    public int UpToDateDependencies { get; set; }
    public int MinorUpdates { get; set; }
    public int MajorUpdates { get; set; }
    public int MajorUpdatesInProduction { get; set; }
    public int DeprecatedDependencies { get; set; }
    public int VulnerableDependencies { get; set; }
    public int Vulnerabilities { get; set; }
    public int CriticalVulnerabilities { get; set; }
    public int HighVulnerabilities { get; set; }
    public int MediumVulnerabilities { get; set; }
    public int LowVulnerabilities { get; set; }
    public int KnownExploitedVulnerabilities { get; set; }

    public static ProjectInventoryCounts Of(IEnumerable<Dependency> dependencies)
    {
        List<Dependency> inventory = dependencies.ToList();
        List<Vulnerability> vulnerabilities = inventory.SelectMany(d => d.Vulnerabilities).ToList();

        return new ProjectInventoryCounts
        {
            Dependencies = inventory.Count,
            UpToDateDependencies = inventory.Count(d => d.Status == DependencyStatus.UpToDate),
            MinorUpdates = inventory.Count(d => d.Status == DependencyStatus.MinorUpdate),
            MajorUpdates = inventory.Count(d => d.Status == DependencyStatus.MajorUpdate),
            MajorUpdatesInProduction = inventory.Count(FindingRules.IsMajorUpdateInProduction),
            DeprecatedDependencies = inventory.Count(d => d.IsDeprecated),
            VulnerableDependencies = inventory.Count(d => d.Status == DependencyStatus.Vulnerable),
            Vulnerabilities = vulnerabilities.Count,
            CriticalVulnerabilities = vulnerabilities.Count(v => v.Severity == VulnerabilitySeverity.Critical),
            HighVulnerabilities = vulnerabilities.Count(v => v.Severity == VulnerabilitySeverity.High),
            MediumVulnerabilities = vulnerabilities.Count(v => v.Severity == VulnerabilitySeverity.Medium),
            LowVulnerabilities = vulnerabilities.Count(v => v.Severity == VulnerabilitySeverity.Low),
            KnownExploitedVulnerabilities = vulnerabilities.Count(v => v.IsKnownExploited)
        };
    }

    public static ProjectInventoryCounts Sum(IEnumerable<ProjectInventoryCounts> counts)
    {
        List<ProjectInventoryCounts> all = counts.ToList();

        return new ProjectInventoryCounts
        {
            Dependencies = all.Sum(c => c.Dependencies),
            UpToDateDependencies = all.Sum(c => c.UpToDateDependencies),
            MinorUpdates = all.Sum(c => c.MinorUpdates),
            MajorUpdates = all.Sum(c => c.MajorUpdates),
            MajorUpdatesInProduction = all.Sum(c => c.MajorUpdatesInProduction),
            DeprecatedDependencies = all.Sum(c => c.DeprecatedDependencies),
            VulnerableDependencies = all.Sum(c => c.VulnerableDependencies),
            Vulnerabilities = all.Sum(c => c.Vulnerabilities),
            CriticalVulnerabilities = all.Sum(c => c.CriticalVulnerabilities),
            HighVulnerabilities = all.Sum(c => c.HighVulnerabilities),
            MediumVulnerabilities = all.Sum(c => c.MediumVulnerabilities),
            LowVulnerabilities = all.Sum(c => c.LowVulnerabilities),
            KnownExploitedVulnerabilities = all.Sum(c => c.KnownExploitedVulnerabilities)
        };
    }
}
