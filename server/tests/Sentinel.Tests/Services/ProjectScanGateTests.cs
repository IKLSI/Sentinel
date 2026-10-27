using FluentAssertions;
using Sentinel.Application.Scanning;

namespace Sentinel.Tests.Services;

public class ProjectScanGateTests
{
    [Fact]
    public void Queue_ProjectAlreadyQueued_ReturnsAlreadyPending()
    {
        ProjectScanGate gate = new ProjectScanGate();
        Guid projectId = Guid.NewGuid();

        gate.Queue(projectId).Should().Be(ScanQueueing.NewJob);
        gate.Queue(projectId).Should().Be(ScanQueueing.AlreadyPending);
    }

    [Fact]
    public void TryStart_ScanAlreadyRunning_ReturnsNullUntilCompleted()
    {
        ProjectScanGate gate = new ProjectScanGate();
        Guid projectId = Guid.NewGuid();

        using CancellationTokenSource? first = gate.TryStart(projectId, CancellationToken.None);
        first.Should().NotBeNull();
        gate.TryStart(projectId, CancellationToken.None).Should().BeNull();
        gate.Queue(projectId).Should().Be(ScanQueueing.AlreadyPending);

        gate.Complete(projectId);

        gate.Queue(projectId).Should().Be(ScanQueueing.NewJob);
        using CancellationTokenSource? second = gate.TryStart(projectId, CancellationToken.None);
        second.Should().NotBeNull();
    }

    [Fact]
    public void TryCancel_QueuedScan_SkipsItsPendingJob()
    {
        ProjectScanGate gate = new ProjectScanGate();
        Guid projectId = Guid.NewGuid();
        gate.Queue(projectId);

        gate.TryCancel(projectId).Should().Be(ScanCancellation.Withdrawn);

        gate.TryStart(projectId, CancellationToken.None).Should().BeNull();
    }

    [Fact]
    public void Queue_AfterWithdrawingAQueuedScan_ReusesThePendingJob()
    {
        ProjectScanGate gate = new ProjectScanGate();
        Guid projectId = Guid.NewGuid();
        gate.Queue(projectId);
        gate.TryCancel(projectId);

        gate.Queue(projectId).Should().Be(ScanQueueing.Revived);

        using CancellationTokenSource? scan = gate.TryStart(projectId, CancellationToken.None);
        scan.Should().NotBeNull();
    }

    [Fact]
    public void TryCancel_RunningScan_CancelsItsToken()
    {
        ProjectScanGate gate = new ProjectScanGate();
        Guid projectId = Guid.NewGuid();
        using CancellationTokenSource? scan = gate.TryStart(projectId, CancellationToken.None);

        gate.TryCancel(projectId).Should().Be(ScanCancellation.Interrupted);

        scan!.Token.IsCancellationRequested.Should().BeTrue();
    }

    [Fact]
    public void TryCancel_SealedScan_IsRefused()
    {
        ProjectScanGate gate = new ProjectScanGate();
        Guid projectId = Guid.NewGuid();
        using CancellationTokenSource? scan = gate.TryStart(projectId, CancellationToken.None);
        gate.Seal(projectId);

        gate.TryCancel(projectId).Should().Be(ScanCancellation.NotCancellable);

        scan!.Token.IsCancellationRequested.Should().BeFalse();
    }

    [Fact]
    public void TryCancel_NoScan_IsRefused()
    {
        new ProjectScanGate().TryCancel(Guid.NewGuid()).Should().Be(ScanCancellation.NotCancellable);
    }
}
