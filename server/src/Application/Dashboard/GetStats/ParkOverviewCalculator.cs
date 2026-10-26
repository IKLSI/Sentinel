using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.Dashboard.GetStats;

public static class ParkOverviewCalculator
{
    public const int EndingSoonThresholdDays = 90;

    private static readonly string[] GradeOrder = ["A", "B", "C", "D", "E", "F"];

    public static ParkOverviewDto Build(IReadOnlyList<DashboardProjectRow> projects,
        IReadOnlyList<RuntimeDeadline> deadlines, int? scoreDelta)
    {
        ProjectInventoryCounts totals = ProjectInventoryCounts.Sum(projects.Select(p => p.InventoryCounts));

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
                Total = totals.Vulnerabilities,
                Critical = totals.CriticalVulnerabilities,
                High = totals.HighVulnerabilities,
                Medium = totals.MediumVulnerabilities,
                Low = totals.LowVulnerabilities,
                KnownExploited = totals.KnownExploitedVulnerabilities,
            },
            Dependencies = new DependencyCountsDto
            {
                Total = totals.Dependencies,
                UpToDate = totals.UpToDateDependencies,
                MinorUpdate = totals.MinorUpdates,
                MajorUpdate = totals.MajorUpdates,
                EndOfLife = totals.DeprecatedDependencies,
                Vulnerable = totals.VulnerableDependencies,
            },
            RuntimesEndingSoon = endingSoon.Count,
            NextRuntimeEolInDays = endingSoon.Count > 0 ? endingSoon.Min(d => d.DaysLeft) : null,
            MajorUpdatesInProduction = totals.MajorUpdatesInProduction,
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
