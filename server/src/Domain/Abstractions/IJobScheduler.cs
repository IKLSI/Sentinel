using System.Linq.Expressions;

namespace Sentinel.Domain.Abstractions;

public interface IJobScheduler
{
    void Enqueue<TJob>(Expression<Func<TJob, Task>> methodCall);

    void Schedule<TJob>(Expression<Func<TJob, Task>> methodCall, TimeSpan delay);

    void TriggerRecurring(string recurringJobId);
}
