using FluentAssertions;
using Sentinel.Application.TechHealth;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Tests.Services;

public class ProjectMapperTests
{
    [Fact]
    public void ToDto_EmptyProject_ReturnsZeroCounts()
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

        var dto = ProjectMapper.ToDto(project);

        dto.TotalDependencies.Should().Be(0);
        dto.CriticalVulnerabilities.Should().Be(0);
        dto.TotalVulnerabilities.Should().Be(0);
        dto.Dependencies.Should().BeEmpty();
        dto.Runtimes.Should().BeEmpty();
    }

    [Fact]
    public void ToDto_CountsCriticalVulnsAcrossDependencies()
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

        var dto = ProjectMapper.ToDto(project);

        dto.TotalVulnerabilities.Should().Be(3);
        dto.CriticalVulnerabilities.Should().Be(2);
    }

    [Fact]
    public void ToDto_MapsRuntimes()
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

        var dto = ProjectMapper.ToDto(project);

        dto.Runtimes.Should().HaveCount(2);
        dto.Runtimes.Should().Contain(r => r.Name == "Node.js" && r.IsEol == false);
        dto.Runtimes.Should().Contain(r => r.Name == "Python" && r.IsEol == true);
    }

    [Fact]
    public void ToDto_GroupsRuntimeDeclarationsOfTheSameTechnology()
    {
        Project project = new Project
        {
            Id = Guid.NewGuid(),
            Name = "Monorepo",
            RepositoryType = RepositoryType.GitHub,
            ScanFrequency = ScanFrequency.Weekly,
            Dependencies = new List<Dependency>(),
            Runtimes = new List<Runtime>
            {
                new() { Name = "Node.js", Version = "20.11.0", IsEol = false },
                new() { Name = "Node.js", Version = "18.20.4", IsEol = true },
            },
        };

        var dto = ProjectMapper.ToDto(project);

        RuntimeDto runtime = dto.Runtimes.Should().ContainSingle().Subject;
        runtime.Version.Should().Be("18.20.4");
        runtime.IsEol.Should().BeTrue();
        runtime.Versions.Should().ContainInOrder("18.20.4", "20.11.0");
    }

    [Fact]
    public void ToDto_LieLeTicketOuvertEnPrioriteAuFinding()
    {
        Dependency dependency = new()
        {
            Id = Guid.NewGuid(),
            Name = "lodash",
            CurrentVersion = "1.0.0",
            Ecosystem = DependencyEcosystem.Npm,
            Vulnerabilities = new List<Vulnerability>
            {
                new() { Id = Guid.NewGuid(), CveId = "GHSA-1", PackageName = "lodash" }
            }
        };
        Project project = new()
        {
            Id = Guid.NewGuid(),
            Name = "P",
            Dependencies = new List<Dependency> { dependency },
            Runtimes = new List<Runtime>()
        };
        string findingKey = FindingKeys.ForVulnerability(DependencyEcosystem.Npm, "lodash", "GHSA-1");
        Guid openTicketId = Guid.NewGuid();

        ProjectDto dto = ProjectMapper.ToDto(project,
        [
            new FindingTicketRow(FindingKind.Vulnerability, findingKey, Guid.NewGuid(), 1, TicketStatus.Resolved,
                DateTime.UtcNow),
            new FindingTicketRow(FindingKind.Vulnerability, findingKey, openTicketId, 2, TicketStatus.InProgress,
                DateTime.UtcNow.AddDays(-1))
        ]);

        VulnerabilityDto vulnerability = dto.Dependencies.Single().Vulnerabilities.Single();
        vulnerability.FindingKey.Should().Be(findingKey);
        vulnerability.LinkedTicket!.Id.Should().Be(openTicketId);
        vulnerability.LinkedTicket.Status.Should().Be("inprogress");
        dto.Dependencies.Single().LinkedTicket.Should().BeNull();
    }
}
