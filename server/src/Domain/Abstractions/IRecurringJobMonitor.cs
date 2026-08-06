using Sentinel.Domain.Jobs;

namespace Sentinel.Domain.Abstractions;

public interface IRecurringJobMonitor
{
    IReadOnlyList<RecurringJobSnapshot> List();
}
