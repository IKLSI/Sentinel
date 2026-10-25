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
        IReadOnlyList<RuntimeDeadline> deadlines, IReadOnlyDictionary<Guid, HashSet<Guid>> suppressedIdsByProject)
    {
        ILookup<Guid?, OpenTicketRow> ticketsByProject = openTickets.ToLookup(t => t.ProjectId);
        Dictionary<Guid, Project> projectsById = projects.ToDictionary(project => project.Id);

        return priorityIds
            .Where(projectsById.ContainsKey)
            .Select(id => projectsById[id])
            .Select(project => ToDto(project, baselineScores, ticketsByProject[project.Id].ToList(), deadlines,
                suppressedIdsByProject.GetValueOrDefault(project.Id) ?? []))
            .ToList();
    }

    private static ProjectHealthDto ToDto(Project project, IReadOnlyDictionary<Guid, int> baselineScores,
        IReadOnlyList<OpenTicketRow> projectTickets, IReadOnlyList<RuntimeDeadline> deadlines,
        HashSet<Guid> suppressedIds)
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
            CriticalVulnerabilityCount =
                CountOpenVulnerabilities(project, suppressedIds, VulnerabilitySeverity.Critical),
            HighVulnerabilityCount = CountOpenVulnerabilities(project, suppressedIds, VulnerabilitySeverity.High),
            EolRuntimeCount = RuntimeGrouping.ByName(project.Runtimes).Count(FindingRules.IsEol),
            NextAction = NextActionResolver.Resolve(project, projectTickets, deadlines),
        };
    }

    private static int CountOpenVulnerabilities(Project project, HashSet<Guid> suppressedIds,
        VulnerabilitySeverity severity) =>
        project.Dependencies
            .SelectMany(dependency => dependency.Vulnerabilities)
            .Count(vulnerability => vulnerability.Severity == severity && !suppressedIds.Contains(vulnerability.Id));
}
