using Hangfire;
using Hangfire.Storage;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.DTOs.Jobs;

namespace Sentinel.Application.Jobs.GetRecurring;

public class RecurringJobListService : IService
{
    public Result<List<RecurringJobStatusDto>> Execute()
    {
        using IStorageConnection connection = JobStorage.Current.GetConnection();

        return connection.GetRecurringJobs()
            .Select(job => new RecurringJobStatusDto(
                job.Id,
                job.Cron,
                job.LastJobState,
                job.LastExecution,
                job.NextExecution,
                job.Error))
            .ToList();
    }
}
