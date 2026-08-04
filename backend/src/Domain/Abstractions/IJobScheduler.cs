using System.Linq.Expressions;

namespace Sentinel.Domain.Abstractions;

public interface IJobScheduler
{
    void Enqueue<TJob>(Expression<Func<TJob, Task>> methodCall);

    void TriggerRecurring(string recurringJobId);
}
