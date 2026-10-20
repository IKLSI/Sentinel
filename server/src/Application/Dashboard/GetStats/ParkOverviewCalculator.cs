using Sentinel.Domain.Entities;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.Dashboard.GetStats;

public static class ParkOverviewCalculator
{
    public const int EndingSoonThresholdDays = 90;

    private static readonly string[] GradeOrder = ["A", "B", "C", "D", "E", "F"];

    public static ParkOverviewDto Build(IReadOnlyList<Project> projects, IReadOnlyList<RuntimeDeadline> deadlines,
        int? scoreDelta)
    {
        List<int> scores = projects.Where(p => p.HealthScore != null).Select(p => p.HealthScore!.Value).ToList();
        int? averageScore = scores.Count > 0 ? (int)Math.Round(scores.Average()) : null;

        List<Dependency> dependencies = projects.SelectMany(p => p.Dependencies).ToList();
        List<Vulnerability> vulnerabilities = dependencies.SelectMany(d => d.Vulnerabilities).ToList();
        List<RuntimeDeadline> endingSoon = deadlines.Where(d => d.DaysLeft <= EndingSoonThresholdDays).ToList();

        return new ParkOverviewDto
        {
            AverageScore = averageScore,
            Grade = averageScore is int score ? HealthScoreCalculator.ToGrade(score) : null,
            ScoreDelta = scoreDelta,
            ProjectCount = projects.Count,
            GradeDistribution = BuildGradeDistribution(projects),
            Vulnerabilities = new VulnerabilityCountsDto
            {
                Total = vulnerabilities.Count,
                Critical = vulnerabilities.Count(v => v.Severity == VulnerabilitySeverity.Critical),
                High = vulnerabilities.Count(v => v.Severity == VulnerabilitySeverity.High),
                Medium = vulnerabilities.Count(v => v.Severity == VulnerabilitySeverity.Medium),
                Low = vulnerabilities.Count(v => v.Severity == VulnerabilitySeverity.Low),
                KnownExploited = vulnerabilities.Count(v => v.IsKnownExploited),
            },
            Dependencies = new DependencyCountsDto
            {
                Total = dependencies.Count,
                UpToDate = dependencies.Count(d => d.Status == DependencyStatus.UpToDate),
                MinorUpdate = dependencies.Count(d => d.Status == DependencyStatus.MinorUpdate),
                MajorUpdate = dependencies.Count(d => d.Status == DependencyStatus.MajorUpdate),
                EndOfLife = dependencies.Count(d => d.Status == DependencyStatus.EOL),
                Vulnerable = dependencies.Count(d => d.Status == DependencyStatus.Vulnerable),
            },
            RuntimesEndingSoon = endingSoon.Count,
            NextRuntimeEolInDays = endingSoon.Count > 0 ? endingSoon.Min(d => d.DaysLeft) : null,
            MajorUpdatesInProduction = dependencies.Count(d =>
                d.Status == DependencyStatus.MajorUpdate && d.IsDirect && d.Type == DependencyType.Prod),
        };
    }

    private static List<GradeCountDto> BuildGradeDistribution(IReadOnlyList<Project> projects) =>
        projects
            .Where(p => p.HealthGrade != null)
            .GroupBy(p => p.HealthGrade!)
            .Select(group => new GradeCountDto { Grade = group.Key, Count = group.Count() })
            .OrderBy(grade => Array.IndexOf(GradeOrder, grade.Grade))
            .ToList();
}
