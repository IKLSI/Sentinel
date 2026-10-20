using Sentinel.Domain.Repositories;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.Dashboard.GetStats;

public static class ParkOverviewCalculator
{
    public const int EndingSoonThresholdDays = 90;

    private static readonly string[] GradeOrder = ["A", "B", "C", "D", "E", "F"];

    public static ParkOverviewDto Build(IReadOnlyList<DashboardProjectRow> projects,
        VulnerabilityTotalsRow vulnerabilities, DependencyTotalsRow dependencies,
        IReadOnlyList<RuntimeDeadline> deadlines, int? scoreDelta)
    {
        List<int> scores = projects.Where(p => p.HealthScore != null).Select(p => p.HealthScore!.Value).ToList();
        int? averageScore = scores.Count > 0 ? (int)Math.Round(scores.Average()) : null;

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
                Total = vulnerabilities.Total,
                Critical = vulnerabilities.Critical,
                High = vulnerabilities.High,
                Medium = vulnerabilities.Medium,
                Low = vulnerabilities.Low,
                KnownExploited = vulnerabilities.KnownExploited,
            },
            Dependencies = new DependencyCountsDto
            {
                Total = dependencies.Total,
                UpToDate = dependencies.UpToDate,
                MinorUpdate = dependencies.MinorUpdate,
                MajorUpdate = dependencies.MajorUpdate,
                EndOfLife = dependencies.Deprecated,
                Vulnerable = dependencies.Vulnerable,
            },
            RuntimesEndingSoon = endingSoon.Count,
            NextRuntimeEolInDays = endingSoon.Count > 0 ? endingSoon.Min(d => d.DaysLeft) : null,
            MajorUpdatesInProduction = dependencies.MajorUpdatesInProduction,
        };
    }

    private static List<GradeCountDto> BuildGradeDistribution(IReadOnlyList<DashboardProjectRow> projects) =>
        projects
            .Where(p => p.HealthGrade != null)
            .GroupBy(p => p.HealthGrade!)
            .Select(group => new GradeCountDto { Grade = group.Key, Count = group.Count() })
            .OrderBy(grade => Array.IndexOf(GradeOrder, grade.Grade))
            .ToList();
}
