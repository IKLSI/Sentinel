using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.Dashboard.GetStats;

public static class ProjectHealthBuilder
{
    public static List<Guid> SelectPriorityIds(IReadOnlyList<DashboardProjectRow> projects, int take) =>
        projects
            .OrderByDescending(project => NextActionResolver.HasScanError(project.Coverage, project.LastScanError))
            .ThenBy(project => project.HealthScore ?? int.MaxValue)
            .ThenBy(project => project.Name)
            .Take(take)
            .Select(project => project.Id)
            .ToList();

    public static List<ProjectHealthDto> Build(IReadOnlyList<Guid> priorityIds, IReadOnlyList<Project> projects,
        IReadOnlyDictionary<Guid, int> baselineScores, IReadOnlyList<OpenTicketRow> openTickets,
        IReadOnlyList<RuntimeDeadline> deadlines)
    {
        ILookup<Guid?, OpenTicketRow> ticketsByProject = openTickets.ToLookup(t => t.ProjectId);
        Dictionary<Guid, Project> projectsById = projects.ToDictionary(project => project.Id);

        return priorityIds
            .Where(projectsById.ContainsKey)
            .Select(id => projectsById[id])
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
