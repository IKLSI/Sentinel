using System.Linq.Expressions;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Sentinel.Application.Scanning;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Entities;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Services;

public class DueProjectScanServiceTests
{
    private sealed class RecordingJobScheduler : IJobScheduler
    {
        public List<(Guid ProjectId, TimeSpan Delay)> Scheduled { get; } = new();

        public void Enqueue<TJob>(string queue, Expression<Func<TJob, Task>> methodCall) =>
            Schedule(queue, methodCall, TimeSpan.Zero);

        public void Schedule<TJob>(string queue, Expression<Func<TJob, Task>> methodCall, TimeSpan delay)
        {
            MethodCallExpression call = (MethodCallExpression)methodCall.Body;
            Guid projectId = (Guid)Expression.Lambda(call.Arguments[0]).Compile().DynamicInvoke()!;

            Scheduled.Add((projectId, delay));
        }
    }

    [Fact]
    public async Task ScheduleAllDueAsync_DailyProjectScannedJustAfterYesterdaysRun_IsDue()
    {
        using TestScope scope = new TestScope();
        Project scannedYesterday = NewProject(scope, ScanFrequency.Daily, DateTime.UtcNow.AddHours(-23).AddMinutes(-59));
        await scope.SeedAsync(scope.NewOrganization(), scannedYesterday);

        RecordingJobScheduler jobs = new RecordingJobScheduler();

        await Build(scope, jobs).ScheduleAllDueAsync(CancellationToken.None);

        jobs.Scheduled.Select(job => job.ProjectId).Should().ContainSingle().Which.Should().Be(scannedYesterday.Id);
    }

    [Fact]
    public async Task ScheduleAllDueAsync_RecentlyScannedOrManualProjects_AreNotScheduled()
    {
        using TestScope scope = new TestScope();
        await scope.SeedAsync(
            scope.NewOrganization(),
            NewProject(scope, ScanFrequency.Daily, DateTime.UtcNow.AddHours(-2)),
            NewProject(scope, ScanFrequency.Weekly, DateTime.UtcNow.AddDays(-3)),
            NewProject(scope, ScanFrequency.Manual, null));

        RecordingJobScheduler jobs = new RecordingJobScheduler();

        await Build(scope, jobs).ScheduleAllDueAsync(CancellationToken.None);

        jobs.Scheduled.Should().BeEmpty();
    }

    [Fact]
    public async Task ScheduleAllDueAsync_SchedulesOneStaggeredJobPerDueProject()
    {
        using TestScope scope = new TestScope();
        Project daily = NewProject(scope, ScanFrequency.Daily, null);
        Project weekly = NewProject(scope, ScanFrequency.Weekly, DateTime.UtcNow.AddDays(-8));
        Project monthly = NewProject(scope, ScanFrequency.Monthly, DateTime.UtcNow.AddDays(-31));
        await scope.SeedAsync(scope.NewOrganization(), daily, weekly, monthly);

        RecordingJobScheduler jobs = new RecordingJobScheduler();

        await Build(scope, jobs).ScheduleAllDueAsync(CancellationToken.None);

        jobs.Scheduled.Select(job => job.ProjectId).Should().BeEquivalentTo([daily.Id, weekly.Id, monthly.Id]);
        jobs.Scheduled.Select(job => job.Delay).Should().BeInAscendingOrder().And.OnlyHaveUniqueItems();
        jobs.Scheduled[0].Delay.Should().Be(TimeSpan.Zero);
    }

    [Fact]
    public async Task ScheduleAllForOrganizationAsync_QueuesEveryProjectImmediately()
    {
        using TestScope scope = new TestScope();
        Project recentlyScanned = NewProject(scope, ScanFrequency.Weekly, DateTime.UtcNow.AddHours(-1));
        Project manual = NewProject(scope, ScanFrequency.Manual, null);
        await scope.SeedAsync(scope.NewOrganization(), recentlyScanned, manual);

        RecordingJobScheduler jobs = new RecordingJobScheduler();

        await Build(scope, jobs).ScheduleAllForOrganizationAsync(scope.OrganizationId, CancellationToken.None);

        jobs.Scheduled.Select(job => job.ProjectId).Should().BeEquivalentTo([recentlyScanned.Id, manual.Id]);
        jobs.Scheduled.Should().OnlyContain(job => job.Delay == TimeSpan.Zero);
    }

    [Fact]
    public async Task ScheduleAllForOrganizationAsync_ProjectAlreadyQueued_IsNotScheduledTwice()
    {
        using TestScope scope = new TestScope();
        Project daily = NewProject(scope, ScanFrequency.Daily, null);
        await scope.SeedAsync(scope.NewOrganization(), daily);

        RecordingJobScheduler jobs = new RecordingJobScheduler();
        DueProjectScanService service = Build(scope, jobs);

        await service.ScheduleAllForOrganizationAsync(scope.OrganizationId, CancellationToken.None);
        await service.ScheduleAllForOrganizationAsync(scope.OrganizationId, CancellationToken.None);

        jobs.Scheduled.Select(job => job.ProjectId).Should().ContainSingle().Which.Should().Be(daily.Id);
    }

    [Fact]
    public async Task ScheduleAllForOrganizationAsync_OtherOrganizationProjects_AreNotScheduled()
    {
        using TestScope scope = new TestScope();
        Project daily = NewProject(scope, ScanFrequency.Daily, null);
        await scope.SeedAsync(scope.NewOrganization(), daily);

        RecordingJobScheduler jobs = new RecordingJobScheduler();

        await Build(scope, jobs).ScheduleAllForOrganizationAsync(Guid.NewGuid(), CancellationToken.None);

        jobs.Scheduled.Should().BeEmpty();
    }

    private static DueProjectScanService Build(TestScope scope, IJobScheduler jobs) =>
        new DueProjectScanService(scope.Projects, jobs, new ProjectScanGate(),
            new ScanProgressTracker(new NoopRealtimeNotifier()), NullLogger<DueProjectScanService>.Instance);

    private static Project NewProject(TestScope scope, ScanFrequency frequency, DateTime? lastScanAt) => new()
    {
        OrganizationId = scope.OrganizationId,
        Name = $"Projet {frequency}",
        ScanFrequency = frequency,
        LastScanAt = lastScanAt
    };
}
