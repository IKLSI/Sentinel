using Sentinel.Domain.Models;

namespace Sentinel.Domain.TechHealth;

public static class HealthScoreCalculator
{
    private const int MaxOutdatedPenalty = 40;
    private const int MajorUpdateWeight = 2;
    private const int MinorUpdateWeight = 1;
    private const int CriticalPenalty = 15;
    private const int HighPenalty = 10;
    private const int MediumPenalty = 5;
    private const int LowPenalty = 2;
    private const int EolDependencyPenalty = 10;
    private const int EolRuntimePenalty = 15;
    private const int ScoreDecayConstant = 150;
    private const int MaxScore = 100;

    public static int Calculate(Project project)
    {
        int penalty = OutdatedPenalty(project);

        foreach (Dependency dependency in project.Dependencies)
        {
            if (dependency.Status == DependencyStatus.EOL) penalty += EolDependencyPenalty;

            penalty += dependency.Vulnerabilities.Sum(vulnerability => SeverityPenalty(vulnerability.Severity));
        }

        penalty += project.Runtimes.Count(runtime => runtime.IsEol) * EolRuntimePenalty;

        return (int)Math.Round(MaxScore * Math.Exp(-penalty / (double)ScoreDecayConstant));
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

        int outdatedWeight = project.Dependencies.Sum(dependency => dependency.Status switch
        {
            DependencyStatus.MajorUpdate => MajorUpdateWeight,
            DependencyStatus.MinorUpdate => MinorUpdateWeight,
            _ => 0
        });

        double maxWeight = project.Dependencies.Count * MajorUpdateWeight;

        return (int)Math.Round(outdatedWeight / maxWeight * MaxOutdatedPenalty);
    }
}
