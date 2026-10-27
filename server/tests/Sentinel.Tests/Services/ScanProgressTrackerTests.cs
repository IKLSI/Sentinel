using FluentAssertions;
using Sentinel.Application.Common;
using Sentinel.Application.Scanning;
using Sentinel.Application.Scanning.GetProgress;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Realtime;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Services;

public class ScanProgressTrackerTests
{
    private static readonly Guid OrganizationId = Guid.NewGuid();

    [Fact]
    public void Report_DiffuseLEtapeALOrganisationDuProjet()
    {
        RecordingNotifier notifier = new RecordingNotifier();
        ScanProgressTracker tracker = new ScanProgressTracker(notifier);
        Guid projectId = Guid.NewGuid();

        tracker.For(projectId, OrganizationId).Report(ScanStage.Manifests);

        tracker.ListForOrganization(OrganizationId).Should().ContainSingle(entry =>
            entry.ProjectId == projectId && entry.Stage == ScanStage.Manifests);
        notifier.Events.Should().Equal((OrganizationId, new RealtimeEvent(RealtimeResources.ScanProgress, projectId)));
    }

    [Fact]
    public void Complete_RetireLeScanEtPrevientLesClients()
    {
        RecordingNotifier notifier = new RecordingNotifier();
        ScanProgressTracker tracker = new ScanProgressTracker(notifier);
        Guid projectId = Guid.NewGuid();
        tracker.Report(projectId, OrganizationId, ScanStage.Scoring);

        tracker.Complete(projectId);

        tracker.ListForOrganization(OrganizationId).Should().BeEmpty();
        notifier.Events.Select(item => item.Notification).Should().EndWith(
            new RealtimeEvent(RealtimeResources.ScanProgress, projectId));
    }

    [Fact]
    public void ListForOrganization_NeRetourneQueLesScansDeLOrganisation()
    {
        ScanProgressTracker tracker = new ScanProgressTracker(new RecordingNotifier());
        tracker.Report(Guid.NewGuid(), Guid.NewGuid(), ScanStage.Repository);

        tracker.ListForOrganization(OrganizationId).Should().BeEmpty();
    }

    [Fact]
    public async Task ScanProgressListService_IndiqueLEtapeCouranteSurLeTotal()
    {
        ScanProgressTracker tracker = new ScanProgressTracker(new RecordingNotifier());
        Guid projectId = Guid.NewGuid();
        tracker.Report(projectId, OrganizationId, ScanStage.Registries);

        Result<List<ScanProgressDto>> result = await new ScanProgressListService(tracker,
                new FakeTenantContext { OrganizationId = OrganizationId })
            .ExecuteAsync(TestContext.Current.CancellationToken);

        ScanProgressDto progress = result.Value!.Should().ContainSingle().Subject;
        progress.Stage.Should().Be(nameof(ScanStage.Registries));
        progress.Step.Should().Be(4);
        progress.TotalSteps.Should().Be(Enum.GetValues<ScanStage>().Length);
    }

    private sealed class RecordingNotifier : IRealtimeNotifier
    {
        public List<(Guid OrganizationId, RealtimeEvent Notification)> Events { get; } = [];

        public Task NotifyOrganizationAsync(Guid organizationId, RealtimeEvent notification)
        {
            Events.Add((organizationId, notification));
            return Task.CompletedTask;
        }

        public Task NotifyAllAsync(RealtimeEvent notification) => Task.CompletedTask;
    }
}
