using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.Dashboard.GetStats;

public static class ProjectHealthBuilder
{
    public static List<ProjectHealthDto> Build(IReadOnlyList<Project> projects,
        IReadOnlyDictionary<Guid, int> baselineScores, IReadOnlyList<OpenTicketRow> openTickets,
        IReadOnlyList<RuntimeDeadline> deadlines, int take)
    {
        ILookup<Guid?, OpenTicketRow> ticketsByProject = openTickets.ToLookup(t => t.ProjectId);

        return projects
            .OrderByDescending(NextActionResolver.HasScanError)
            .ThenBy(project => project.HealthScore ?? int.MaxValue)
            .ThenBy(project => project.Name)
            .Take(take)
            .Select(project => ToDto(project, baselineScores, ticketsByProject[project.Id].ToList(), deadlines))
            .ToList();
    }

    private static ProjectHealthDto ToDto(Project project, IReadOnlyDictionary<Guid, int> baselineScores,
        IReadOnlyList<OpenTicketRow> projectTickets, IReadOnlyList<RuntimeDeadline> deadlines)
    {
        bool isScored = project.HealthScore != null;

        return new ProjectHealthDto
        {
            Id = project.Id,
            Name = project.Name,
            RepositoryType = project.RepositoryType.ToString(),
            LastScanAt = project.LastScanAt,
            HasScanError = NextActionResolver.HasScanError(project),
            Coverage = project.Coverage.ToString(),
            Score = project.HealthScore,
            Grade = project.HealthGrade,
            ScoreDelta = isScored && baselineScores.TryGetValue(project.Id, out int baseline)
                ? project.HealthScore!.Value - baseline
                : null,
            Breakdown = isScored ? ToBreakdownDto(HealthScoreCalculator.Breakdown(project)) : null,
            NextAction = NextActionResolver.Resolve(project, projectTickets, deadlines),
        };
    }

    private static ScoreBreakdownDto ToBreakdownDto(HealthScoreBreakdown breakdown) => new()
    {
        Security = breakdown.Security,
        SecurityGrade = HealthScoreCalculator.ToGrade(breakdown.Security),
        Runtimes = breakdown.Runtimes,
        RuntimesGrade = HealthScoreCalculator.ToGrade(breakdown.Runtimes),
        Freshness = breakdown.Freshness,
        FreshnessGrade = HealthScoreCalculator.ToGrade(breakdown.Freshness),
    };
}
