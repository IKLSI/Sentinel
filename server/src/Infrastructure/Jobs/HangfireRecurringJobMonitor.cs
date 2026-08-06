using Hangfire;
using Hangfire.Storage;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Jobs;

namespace Sentinel.Infrastructure.Jobs;

public sealed class HangfireRecurringJobMonitor : IRecurringJobMonitor
{
    public IReadOnlyList<RecurringJobSnapshot> List()
    {
        using IStorageConnection connection = JobStorage.Current.GetConnection();

        return connection.GetRecurringJobs()
            .Select(job => new RecurringJobSnapshot(
                job.Id,
                job.Cron,
                job.LastJobState,
                job.LastExecution,
                job.NextExecution,
                job.Error))
            .ToList();
    }
}
