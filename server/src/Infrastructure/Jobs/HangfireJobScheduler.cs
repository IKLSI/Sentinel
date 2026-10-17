using System.Linq.Expressions;
using Hangfire;
using Sentinel.Domain.Abstractions;

namespace Sentinel.Infrastructure.Jobs;

public sealed class HangfireJobScheduler(
    IBackgroundJobClient backgroundJobs,
    IRecurringJobManager recurringJobs) : IJobScheduler
{
    public void Enqueue<TJob>(Expression<Func<TJob, Task>> methodCall) =>
        backgroundJobs.Enqueue(methodCall);

    public void Schedule<TJob>(Expression<Func<TJob, Task>> methodCall, TimeSpan delay) =>
        backgroundJobs.Schedule(methodCall, delay);

    public void TriggerRecurring(string recurringJobId) =>
        recurringJobs.Trigger(recurringJobId);
}
