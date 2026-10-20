using FluentAssertions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Tests.Services;

public class InventoryReconciliationTests
{
    [Fact]
    public void ReconcileDependencies_SamePackageAndVersion_KeepsTheExistingRowAndRefreshesIt()
    {
        Dependency existing = new Dependency
        {
            Name = "axios",
            Ecosystem = DependencyEcosystem.Npm,
            CurrentVersion = "1.6.0",
            Type = DependencyType.Dev,
            Status = DependencyStatus.Vulnerable
        };
        Dependency scanned = new Dependency
        {
            Name = "Axios",
            Ecosystem = DependencyEcosystem.Npm,
            CurrentVersion = "1.6.0",
            LatestVersion = "1.7.0",
            Type = DependencyType.Prod,
            Status = DependencyStatus.MinorUpdate
        };

        InventoryChanges<Dependency> changes =
            InventoryReconciliation.ReconcileDependencies([existing], [scanned]);

        changes.Added.Should().BeEmpty();
        changes.RemovedIds.Should().BeEmpty();
        existing.Type.Should().Be(DependencyType.Prod);
        existing.LatestVersion.Should().Be("1.7.0");
        existing.Status.Should().Be(DependencyStatus.Vulnerable);
    }

    [Fact]
    public void ReconcileDependencies_VersionBumped_ReplacesTheRow()
    {
        Dependency existing = new Dependency
        {
            Name = "axios", Ecosystem = DependencyEcosystem.Npm, CurrentVersion = "1.6.0"
        };
        Dependency scanned = new Dependency
        {
            Name = "axios", Ecosystem = DependencyEcosystem.Npm, CurrentVersion = "1.7.0"
        };

        InventoryChanges<Dependency> changes =
            InventoryReconciliation.ReconcileDependencies([existing], [scanned]);

        changes.Added.Should().ContainSingle().Which.Should().BeSameAs(scanned);
        changes.RemovedIds.Should().ContainSingle().Which.Should().Be(existing.Id);
    }

    [Fact]
    public void ReconcileDependencies_DuplicatedExistingRows_KeepsOneAndRemovesTheOthers()
    {
        Dependency first = new Dependency
        {
            Name = "axios", Ecosystem = DependencyEcosystem.Npm, CurrentVersion = "1.6.0"
        };
        Dependency duplicate = new Dependency
        {
            Name = "axios", Ecosystem = DependencyEcosystem.Npm, CurrentVersion = "1.6.0"
        };
        Dependency scanned = new Dependency
        {
            Name = "axios", Ecosystem = DependencyEcosystem.Npm, CurrentVersion = "1.6.0"
        };

        InventoryChanges<Dependency> changes =
            InventoryReconciliation.ReconcileDependencies([first, duplicate], [scanned]);

        changes.Added.Should().BeEmpty();
        changes.RemovedIds.Should().ContainSingle().Which.Should().Be(duplicate.Id);
    }

    [Fact]
    public void ReconcileRuntimes_SameRuntime_KeepsTheRowAndTakesTheFreshLifecycle()
    {
        Runtime existing = new Runtime { Name = "Node.js", Version = "20", IsEol = false };
        Runtime scanned = new Runtime
        {
            Name = "node.js", Version = "20 ", IsEol = true, EolDate = new DateTime(2026, 4, 30)
        };

        InventoryChanges<Runtime> changes = InventoryReconciliation.ReconcileRuntimes([existing], [scanned]);

        changes.Added.Should().BeEmpty();
        changes.RemovedIds.Should().BeEmpty();
        existing.IsEol.Should().BeTrue();
        existing.EolDate.Should().Be(new DateTime(2026, 4, 30));
    }
}
