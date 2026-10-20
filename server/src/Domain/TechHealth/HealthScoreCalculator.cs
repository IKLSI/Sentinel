using Sentinel.Domain.Entities;
using Sentinel.Domain.Versioning;

namespace Sentinel.Domain.TechHealth;

public static class HealthScoreCalculator
{
    private const double DevDependencyWeight = 0.25;
    private const int MaxOutdatedPenalty = 40;
    private const int MajorUpdateWeight = 2;
    private const int MinorUpdateWeight = 1;
    private const int CriticalPenalty = 15;
    private const int HighPenalty = 10;
    private const int MediumPenalty = 5;
    private const int LowPenalty = 2;
    private const int EolDependencyPenalty = 10;
    private const int EolRuntimePenalty = 15;
    private const int ApproachingEolRuntimePenalty = 5;
    private const int ScoreDecayConstant = 150;
    private const int MaxScore = 100;
    private const int CriticalVulnerabilityCeiling = 74;
    private const int ActivelyThreatenedCeiling = 59;

    public static int Calculate(Project project) => Calculate(project, _ => false);

    public static int Calculate(Project project, Func<Vulnerability, bool> isResolved)
    {
        double penalty = OutdatedPenalty(project);

        foreach (Dependency dependency in project.Dependencies)
        {
            double weight = WeightOf(dependency);

            if (dependency.IsDeprecated) penalty += EolDependencyPenalty * weight;

            penalty += VulnerabilityPenalty(dependency, isResolved) * weight;
        }

        penalty += RuntimePenalty(project);

        return Math.Min(ToScore(penalty), ScoreCeiling(project, isResolved));
    }

    private static int ScoreCeiling(Project project, Func<Vulnerability, bool> isResolved)
    {
        List<Vulnerability> openProductionVulnerabilities = project.Dependencies
            .Where(dependency => dependency.Type == DependencyType.Prod)
            .SelectMany(dependency => dependency.Vulnerabilities)
            .Where(vulnerability => !isResolved(vulnerability))
            .ToList();

        if (openProductionVulnerabilities.Any(VulnerabilityRiskCalculator.IsActivelyThreatened))
            return ActivelyThreatenedCeiling;

        return openProductionVulnerabilities.Any(vulnerability => vulnerability.Severity == VulnerabilitySeverity.Critical)
            ? CriticalVulnerabilityCeiling
            : MaxScore;
    }

    public static HealthScoreBreakdown Breakdown(Project project)
    {
        double securityPenalty = 0;
        double freshnessPenalty = OutdatedPenalty(project);

        foreach (Dependency dependency in project.Dependencies)
        {
            double weight = WeightOf(dependency);

            if (dependency.IsDeprecated) freshnessPenalty += EolDependencyPenalty * weight;

            securityPenalty += VulnerabilityPenalty(dependency, _ => false) * weight;
        }

        return new HealthScoreBreakdown(
            ToScore(securityPenalty),
            ToScore(RuntimePenalty(project)),
            ToScore(freshnessPenalty));
    }

    public static string ToGrade(int score) => score switch
    {
        >= 90 => "A",
        >= 75 => "B",
        >= 60 => "C",
        >= 45 => "D",
        >= 30 => "E",
        _ => "F"
    };

    private static double VulnerabilityPenalty(Dependency dependency, Func<Vulnerability, bool> isResolved) =>
        dependency.Vulnerabilities
            .Where(vulnerability => !isResolved(vulnerability))
            .Sum(vulnerability =>
                SeverityPenalty(vulnerability.Severity) * VulnerabilityRiskCalculator.PenaltyMultiplier(vulnerability));

    private static double RuntimePenalty(Project project) =>
        RuntimeGrouping.ByName(project.Runtimes).Sum(group => FindingRules.IsEol(group)
            ? EolRuntimePenalty
            : FindingRules.IsApproachingEol(group.MostAtRisk, DateTime.UtcNow) ? ApproachingEolRuntimePenalty : 0);

    private static int ToScore(double penalty) => (int)Math.Round(MaxScore * Math.Exp(-penalty / ScoreDecayConstant));

    private static int SeverityPenalty(VulnerabilitySeverity severity) => severity switch
    {
        VulnerabilitySeverity.Critical => CriticalPenalty,
        VulnerabilitySeverity.High => HighPenalty,
        VulnerabilitySeverity.Medium => MediumPenalty,
        VulnerabilitySeverity.Low => LowPenalty,
        _ => 0
    };

    private static double WeightOf(Dependency dependency) =>
        dependency.Type == DependencyType.Dev ? DevDependencyWeight : 1;

    private static double OutdatedPenalty(Project project)
    {
        List<Dependency> directDependencies = project.Dependencies.Where(dependency => dependency.IsDirect).ToList();

        if (directDependencies.Count == 0) return 0;

        double outdatedWeight = directDependencies
            .Sum(dependency => UpdateWeight(dependency) * WeightOf(dependency));

        double maxWeight = directDependencies.Count * MajorUpdateWeight;

        return outdatedWeight / maxWeight * MaxOutdatedPenalty;
    }

    private static int UpdateWeight(Dependency dependency) =>
        DependencyStatusCalculator.UpdateOf(dependency) switch
        {
            DependencyStatus.MajorUpdate => MajorUpdateWeight,
            DependencyStatus.MinorUpdate => MinorUpdateWeight,
            _ => 0
        };
}
