using Sentinel.Application.Security;
using Sentinel.Application.TechHealth.Scan;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Sentinel.Application.Billing;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.TechHealth;

public partial class TechHealthService
{
    public static ScanCoverage ResolveCoverage(Project project, bool scanRan, string? scanError, int manifestsRead)
    {
        if (project.Dependencies.Any() || project.Runtimes.Any()) return ScanCoverage.Covered;
        if (!scanRan) return ScanCoverage.NotScanned;
        if (scanError != null) return ScanCoverage.Failed;
        return manifestsRead == 0 ? ScanCoverage.NoManifest : ScanCoverage.NoDependencies;
    }

    private static int SeverityPenalty(VulnerabilitySeverity severity) => severity switch
    {
        VulnerabilitySeverity.Critical => CriticalPenalty,
        VulnerabilitySeverity.High => HighPenalty,
        VulnerabilitySeverity.Medium => MediumPenalty,
        VulnerabilitySeverity.Low => LowPenalty,
        _ => 0
    };

    private static int OutdatedPenalty(Project project)
    {
        if (project.Dependencies.Count == 0) return 0;

        int outdatedWeight = project.Dependencies.Sum(d => d.Status switch
        {
            DependencyStatus.MajorUpdate => MajorUpdateWeight,
            DependencyStatus.MinorUpdate => MinorUpdateWeight,
            _ => 0
        });

        double maxWeight = project.Dependencies.Count * MajorUpdateWeight;

        return (int)Math.Round(outdatedWeight / maxWeight * MaxOutdatedPenalty);
    }

    public static int CalculateHealthScore(Project project)
    {
        int penalty = OutdatedPenalty(project);

        foreach (Dependency dep in project.Dependencies)
        {
            if (dep.Status == DependencyStatus.EOL) penalty += EolDependencyPenalty;

            penalty += dep.Vulnerabilities.Sum(v => SeverityPenalty(v.Severity));
        }

        penalty += project.Runtimes.Count(r => r.IsEol) * EolRuntimePenalty;

        return (int)Math.Round(MaxScore * Math.Exp(-penalty / (double)ScoreDecayConstant));
    }

    private static string ScoreToGrade(int score) => score switch
    {
        >= 90 => "A",
        >= 75 => "B",
        >= 60 => "C",
        >= 45 => "D",
        >= 30 => "E",
        _ => "F"
    };

}
