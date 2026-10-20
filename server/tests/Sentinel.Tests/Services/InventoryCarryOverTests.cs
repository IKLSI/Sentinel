using FluentAssertions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Tests.Services;

public class InventoryCarryOverTests
{
    [Fact]
    public void ApplyPackageMetadata_RegistryUnavailable_ReusesThePreviousLatestVersion()
    {
        Dependency dependency = new Dependency
        {
            Name = "Axios",
            Ecosystem = DependencyEcosystem.Npm,
            CurrentVersion = "1.0.0",
            Status = DependencyStatus.UpToDate
        };

        InventoryCarryOver.ApplyPackageMetadata([dependency],
            [new PackageMetadataRow(DependencyEcosystem.Npm, "axios", "2.0.0", "axios", "MIT", false)]);

        dependency.LatestVersion.Should().Be("2.0.0");
        dependency.License.Should().Be("MIT");
        dependency.Status.Should().Be(DependencyStatus.MajorUpdate);
    }

    [Fact]
    public void ApplyPackageMetadata_FreshRegistryData_IsKept()
    {
        Dependency dependency = new Dependency
        {
            Name = "axios",
            Ecosystem = DependencyEcosystem.Npm,
            CurrentVersion = "1.0.0",
            LatestVersion = "1.7.0"
        };

        InventoryCarryOver.ApplyPackageMetadata([dependency],
            [new PackageMetadataRow(DependencyEcosystem.Npm, "axios", "1.5.0", null, null, false)]);

        dependency.LatestVersion.Should().Be("1.7.0");
    }

    [Fact]
    public void ApplyRuntimeLifecycle_LifecycleSourceUnavailable_ReusesThePreviousAssessment()
    {
        Runtime runtime = new Runtime { Name = "Node.js", Version = "16" };

        InventoryCarryOver.ApplyRuntimeLifecycle([runtime],
            [new RuntimeLifecycleRow("node.js", "16", true, new DateTime(2023, 9, 11))]);

        runtime.IsEol.Should().BeTrue();
        runtime.EolDate.Should().Be(new DateTime(2023, 9, 11));
    }
}
