using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Jobs;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Jobs.GetRecurring;

public class RecurringJobListService(IRecurringJobMonitor recurringJobs) : IService
{
    public Result<List<RecurringJobStatusDto>> Execute(JobSortField sortBy, SortDirection sortDirection)
    {
        List<RecurringJobStatusDto> jobs = recurringJobs.List()
            .Select(job => new RecurringJobStatusDto(
                job.Id,
                job.Cron,
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

        IEnumerable<RecurringJobStatusDto> sorted = sortBy switch
        {
            JobSortField.LastRun => descending
                ? jobs.OrderByDescending(j => j.LastExecution)
                : jobs.OrderBy(j => j.LastExecution),
            JobSortField.Status => descending
                ? jobs.OrderByDescending(j => j.LastJobState)
                : jobs.OrderBy(j => j.LastJobState),
            JobSortField.NextRun => descending
                ? jobs.OrderByDescending(j => j.NextExecution)
                : jobs.OrderBy(j => j.NextExecution),
            _ => descending
                ? jobs.OrderByDescending(j => j.Id)
                : jobs.OrderBy(j => j.Id)
        };

        return sorted.ToList();
    }
}
