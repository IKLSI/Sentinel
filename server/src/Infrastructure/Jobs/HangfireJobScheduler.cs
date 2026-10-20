using System.Linq.Expressions;
using Hangfire;
using Sentinel.Domain.Abstractions;

namespace Sentinel.Infrastructure.Jobs;

public sealed class HangfireJobScheduler(IBackgroundJobClient backgroundJobs) : IJobScheduler
{
    public void Enqueue<TJob>(string queue, Expression<Func<TJob, Task>> methodCall) =>
        backgroundJobs.Enqueue(queue, methodCall);

    public void Schedule<TJob>(string queue, Expression<Func<TJob, Task>> methodCall, TimeSpan delay) =>
        backgroundJobs.Schedule(queue, methodCall, delay);
}
