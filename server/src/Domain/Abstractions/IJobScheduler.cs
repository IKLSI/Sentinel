using System.Linq.Expressions;

namespace Sentinel.Domain.Abstractions;

public interface IJobScheduler
{
    void Enqueue<TJob>(string queue, Expression<Func<TJob, Task>> methodCall);

    void Schedule<TJob>(string queue, Expression<Func<TJob, Task>> methodCall, TimeSpan delay);
}
