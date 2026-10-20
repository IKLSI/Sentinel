using FluentAssertions;
using Sentinel.Application.TechHealth.Scan;

namespace Sentinel.Tests.Services;

public class ProjectScanGateTests
{
    [Fact]
    public void TryQueue_ProjectAlreadyQueued_ReturnsFalse()
    {
        ProjectScanGate gate = new ProjectScanGate();
        Guid projectId = Guid.NewGuid();

        gate.TryQueue(projectId).Should().BeTrue();
        gate.TryQueue(projectId).Should().BeFalse();
    }

    [Fact]
    public void TryStart_ScanAlreadyRunning_ReturnsFalseUntilCompleted()
    {
        ProjectScanGate gate = new ProjectScanGate();
        Guid projectId = Guid.NewGuid();

        gate.TryStart(projectId).Should().BeTrue();
        gate.TryStart(projectId).Should().BeFalse();
        gate.TryQueue(projectId).Should().BeFalse();

        gate.Complete(projectId);

        gate.TryQueue(projectId).Should().BeTrue();
        gate.TryStart(projectId).Should().BeTrue();
    }
}
