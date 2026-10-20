using Sentinel.Domain.Entities;

namespace Sentinel.Application.Dashboard.GetStats;

public static class RuntimeDeadlineCalculator
{
    public static IReadOnlyList<RuntimeDeadline> Compute(IReadOnlyList<Project> projects, DateOnly today) =>
        projects
            .SelectMany(project => project.Runtimes.Select(runtime => (Project: project, Runtime: runtime)))
            .Where(entry => entry.Runtime.EolDate != null || entry.Runtime.IsEol == true)
            .GroupBy(entry => (entry.Runtime.Name, entry.Runtime.Version))
            .Select(group =>
            {
                DateOnly eolDate = group
                    .Select(entry => entry.Runtime.EolDate is DateTime date ? DateOnly.FromDateTime(date) : today)
                    .Min();

                return new RuntimeDeadline(
                    group.Key.Name,
                    group.Key.Version,
                    eolDate,
                    eolDate.DayNumber - today.DayNumber,
                    group.Select(entry => entry.Project.Id).Distinct().ToList());
            })
            .OrderBy(deadline => deadline.DaysLeft)
            .ThenBy(deadline => deadline.Runtime)
            .ToList();
}
