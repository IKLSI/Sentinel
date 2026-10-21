using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Jobs.GetRecurring;

public class RecurringJobListService(IRecurringJobMonitor recurringJobs) : IService
{
    public Result<List<RecurringJobStatusDto>> Execute(JobSortField sortBy, SortDirection sortDirection)
    {
        List<RecurringJobStatusDto> jobs = recurringJobs.List()
            .Select(job => new RecurringJobStatusDto(
                job.Id,
                job.LastJobState,
                job.LastExecution,
                job.NextExecution,
                job.Error))
            .ToList();

        return ApplySort(jobs, sortBy, sortDirection);
    }

    private static List<RecurringJobStatusDto> ApplySort(List<RecurringJobStatusDto> jobs, JobSortField sortBy,
        SortDirection sortDirection)
    {
        bool descending = sortDirection == SortDirection.Desc;

        IOrderedEnumerable<RecurringJobStatusDto> pinned = jobs.OrderByDescending(IsPinned);

        IOrderedEnumerable<RecurringJobStatusDto> sorted = sortBy switch
        {
            JobSortField.LastRun => descending
                ? pinned.ThenByDescending(j => j.LastExecution)
                : pinned.ThenBy(j => j.LastExecution),
            JobSortField.Status => descending
                ? pinned.ThenByDescending(j => j.LastJobState)
                : pinned.ThenBy(j => j.LastJobState),
            JobSortField.NextRun => descending
                ? pinned.ThenByDescending(j => j.NextExecution)
                : pinned.ThenBy(j => j.NextExecution),
            _ => descending
                ? pinned.ThenByDescending(j => j.Id)
                : pinned.ThenBy(j => j.Id)
        };

        return sorted.ToList();
    }

    private static bool IsPinned(RecurringJobStatusDto job) => job.Id == RecurringJobIds.TechHealthScan;
}
