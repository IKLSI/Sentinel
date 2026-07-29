using FluentAssertions;
using Sentinel.Application.Services;
using Sentinel.Domain.Models;

namespace Sentinel.Tests.Services;

public class TechHealthServiceMapToDtoTests
{
    [Fact]
    public void MapToDto_EmptyProject_ReturnsZeroCounts()
    {
        Project project = new Project
        {
            Id = Guid.NewGuid(),
            Name = "Empty",
            HealthScore = 100,
            HealthGrade = "A",
            RepositoryType = RepositoryType.GitHub,
            ScanFrequency = ScanFrequency.Weekly,
            Dependencies = new List<Dependency>(),
            Runtimes = new List<Runtime>(),
        };

        var dto = TechHealthService.MapToDto(project);

        dto.TotalDependencies.Should().Be(0);
        dto.VulnerableDependencies.Should().Be(0);
        dto.CriticalVulnerabilities.Should().Be(0);
        dto.TotalVulnerabilities.Should().Be(0);
        dto.Dependencies.Should().BeEmpty();
        dto.Runtimes.Should().BeEmpty();
    }

    [Fact]
    public void MapToDto_CountsVulnerableDependencies()
    {
        Project project = new Project
        {
            Id = Guid.NewGuid(),
            Name = "P",
            HealthGrade = "B",
            RepositoryType = RepositoryType.GitHub,
            ScanFrequency = ScanFrequency.Daily,
            Dependencies = new List<Dependency>
            {
                new() { Name = "lib1", CurrentVersion = "1.0", Status = DependencyStatus.Vulnerable, Vulnerabilities = new List<Vulnerability>() },
                new() { Name = "lib2", CurrentVersion = "2.0", Status = DependencyStatus.Vulnerable, Vulnerabilities = new List<Vulnerability>() },
                new() { Name = "lib3", CurrentVersion = "3.0", Status = DependencyStatus.UpToDate, Vulnerabilities = new List<Vulnerability>() },
            },
            Runtimes = new List<Runtime>(),
        };

        var dto = TechHealthService.MapToDto(project);

        dto.TotalDependencies.Should().Be(3);
        dto.VulnerableDependencies.Should().Be(2);
    }

    [Fact]
    public void MapToDto_CountsCriticalVulnsAcrossDependencies()
    {
        Project project = new Project
        {
            Id = Guid.NewGuid(),
            Name = "P",
            HealthGrade = "C",
            RepositoryType = RepositoryType.GitLab,
            ScanFrequency = ScanFrequency.Weekly,
            Dependencies = new List<Dependency>
            {
                new()
                {
                    Name = "lib1", CurrentVersion = "1.0", Status = DependencyStatus.Vulnerable,
                    Vulnerabilities = new List<Vulnerability>
                    {
                        new() { CveId = "CVE-1", Severity = VulnerabilitySeverity.Critical },
                        new() { CveId = "CVE-2", Severity = VulnerabilitySeverity.Medium },
                    }
                },
                new()
                {
                    Name = "lib2", CurrentVersion = "2.0", Status = DependencyStatus.Vulnerable,
                    Vulnerabilities = new List<Vulnerability>
                    {
                        new() { CveId = "CVE-3", Severity = VulnerabilitySeverity.Critical },
                    }
                }
            },
            Runtimes = new List<Runtime>(),
        };

        var dto = TechHealthService.MapToDto(project);

        dto.TotalVulnerabilities.Should().Be(3);
        dto.CriticalVulnerabilities.Should().Be(2);
    }

    [Fact]
    public void MapToDto_MapsRuntimes()
    {
        Project project = new Project
        {
            Id = Guid.NewGuid(),
            Name = "P",
            HealthGrade = "A",
            RepositoryType = RepositoryType.GitHub,
            ScanFrequency = ScanFrequency.Weekly,
            Dependencies = new List<Dependency>(),
            Runtimes = new List<Runtime>
            {
                new() { Name = "Node.js", Version = "20.0", IsEol = false },
                new() { Name = "Python", Version = "3.8", IsEol = true },
            },
        };

        var dto = TechHealthService.MapToDto(project);

        dto.Runtimes.Should().HaveCount(2);
        dto.Runtimes.Should().Contain(r => r.Name == "Node.js" && r.IsEol == false);
        dto.Runtimes.Should().Contain(r => r.Name == "Python" && r.IsEol == true);
    }
}
