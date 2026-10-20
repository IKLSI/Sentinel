using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Dashboard.GetStats;

public static class RuntimeDeadlineCalculator
{
    public static IReadOnlyList<RuntimeDeadline> Compute(IReadOnlyList<DashboardRuntimeRow> runtimes, DateOnly today) =>
        runtimes
            .Where(runtime => !runtime.IsMinimumConstraint && (runtime.EolDate != null || runtime.IsEol == true))
            .GroupBy(runtime => (runtime.Name, runtime.Version))
            .Select(group =>
            {
                DateOnly eolDate = group
                    .Select(runtime => runtime.EolDate is DateTime date ? DateOnly.FromDateTime(date) : today)
                    .Min();

                return new RuntimeDeadline(
                    group.Key.Name,
                    group.Key.Version,
                    eolDate,
                    eolDate.DayNumber - today.DayNumber,
                    group.Select(runtime => runtime.ProjectId).Distinct().ToList());
            })
            .OrderBy(deadline => deadline.DaysLeft)
            .ThenBy(deadline => deadline.Runtime)
            .ToList();
}
