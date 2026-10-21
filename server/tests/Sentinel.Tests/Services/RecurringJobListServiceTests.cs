using FluentAssertions;
using Sentinel.Application.Jobs.GetRecurring;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Jobs;
using Sentinel.Domain.Repositories;

namespace Sentinel.Tests.Services;

public class RecurringJobListServiceTests
{
    private sealed class FakeMonitor(params RecurringJobSnapshot[] jobs) : IRecurringJobMonitor
    {
        public IReadOnlyList<RecurringJobSnapshot> List() => jobs;
    }

    private static readonly DateTime Now = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    private static readonly RecurringJobListService Service = new(new FakeMonitor(
        new RecurringJobSnapshot(RecurringJobIds.DataRetention, "Succeeded", Now, Now.AddHours(1), null),
        new RecurringJobSnapshot(RecurringJobIds.TechHealthScan, "Succeeded", Now.AddDays(-1), Now.AddDays(1), null)));

    [Theory]
    [InlineData(JobSortField.Job, SortDirection.Asc)]
    [InlineData(JobSortField.Job, SortDirection.Desc)]
    [InlineData(JobSortField.LastRun, SortDirection.Desc)]
    [InlineData(JobSortField.NextRun, SortDirection.Asc)]
    public void Execute_AnySort_KeepsTheVulnerabilityScanFirst(JobSortField sortBy, SortDirection direction)
    {
        List<RecurringJobStatusDto> jobs = Service.Execute(sortBy, direction).Value!;

        jobs.First().Id.Should().Be(RecurringJobIds.TechHealthScan);
    }
}
