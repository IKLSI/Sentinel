using Sentinel.Application.Tickets;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.TechHealth;

public static class ProjectMapper
{
    public static ProjectDto ToDto(Project project) => ToDto(project, []);

    public static ProjectDto ToDto(Project project, IReadOnlyList<FindingTicketRow> findingTickets)
    {
        IReadOnlyDictionary<(FindingKind, string), FindingTicketDto> links = IndexLinks(findingTickets);

        return new ProjectDto
        {
            Id = project.Id,
            Name = project.Name,
            RepositoryUrl = project.RepositoryUrl,
            RepositoryType = project.RepositoryType.ToString(),
            LastScanAt = project.LastScanAt,
            HealthScore = project.HealthScore,
            HealthGrade = project.HealthGrade,
            Coverage = project.Coverage.ToString(),
            ScanFrequency = project.ScanFrequency.ToString(),
            TotalDependencies = project.Dependencies?.Count ?? 0,
            CriticalVulnerabilities = project.Dependencies?
                .SelectMany(dependency => dependency.Vulnerabilities)
                .Count(vulnerability => vulnerability.Severity == VulnerabilitySeverity.Critical) ?? 0,
            TotalVulnerabilities = project.Dependencies?
                .SelectMany(dependency => dependency.Vulnerabilities)
                .Count() ?? 0,
            Dependencies = project.Dependencies?.Select(dependency => ToDto(dependency, links)).ToList() ?? [],
            Runtimes = project.Runtimes == null
                ? []
                : RuntimeGrouping.ByName(project.Runtimes).Select(group => ToDto(group, links)).ToList()
        };
    }

    private static IReadOnlyDictionary<(FindingKind, string), FindingTicketDto> IndexLinks(
        IReadOnlyList<FindingTicketRow> findingTickets) =>
        findingTickets
            .GroupBy(row => (row.Kind, row.Key))
            .ToDictionary(
                group => group.Key,
                group => group
                    .OrderByDescending(row => TicketStatusRules.Open.Contains(row.Status))
                    .ThenByDescending(row => row.CreatedAt)
                    .Select(row => new FindingTicketDto
                    {
                        Id = row.TicketId,
                        Reference = TicketReference.For(row.Number),
                        Status = row.Status.ToString().ToLower()
                    })
                    .First());

    private static FindingTicketDto? LinkOf(IReadOnlyDictionary<(FindingKind, string), FindingTicketDto> links,
        FindingKind kind, string findingKey) =>
        links.GetValueOrDefault((kind, findingKey));

    private static DependencyDto ToDto(Dependency dependency,
        IReadOnlyDictionary<(FindingKind, string), FindingTicketDto> links)
    {
        string findingKey = FindingKeys.ForDependency(dependency.Ecosystem, dependency.Name);

        return new DependencyDto
        {
            Id = dependency.Id,
            Name = dependency.Name,
            CurrentVersion = dependency.CurrentVersion,
            LatestVersion = dependency.LatestVersion,
            Type = dependency.Type.ToString(),
            Ecosystem = dependency.Ecosystem.ToString(),
            Status = dependency.Status.ToString(),
            IsOutdated = FindingRules.IsOutdated(dependency),
            FindingKey = findingKey,
            LinkedTicket = LinkOf(links, FindingKind.OutdatedDependency, findingKey),
            Vulnerabilities = dependency.Vulnerabilities
                .Select(vulnerability => ToDto(dependency, vulnerability, links))
                .ToList()
        };
    }

    private static VulnerabilityDto ToDto(Dependency dependency, Vulnerability vulnerability,
        IReadOnlyDictionary<(FindingKind, string), FindingTicketDto> links)
    {
        string findingKey = FindingKeys.ForVulnerability(dependency.Ecosystem, vulnerability.PackageName,
            vulnerability.CveId);

        return new VulnerabilityDto
        {
            Id = vulnerability.Id,
            CveId = vulnerability.CveId,
            CveAlias = vulnerability.CveAlias,
            CvssScore = vulnerability.CvssScore,
            Description = vulnerability.Description,
            Severity = vulnerability.Severity.ToString(),
            FixedVersion = vulnerability.FixedVersion,
            FindingKey = findingKey,
            LinkedTicket = LinkOf(links, FindingKind.Vulnerability, findingKey)
        };
    }

    private static RuntimeDto ToDto(RuntimeGroup group,
        IReadOnlyDictionary<(FindingKind, string), FindingTicketDto> links)
    {
        string findingKey = FindingKeys.ForRuntime(group.MostAtRisk.Name);

        return new RuntimeDto
        {
            Id = group.MostAtRisk.Id,
            Name = group.MostAtRisk.Name,
            Version = group.MostAtRisk.Version,
            Versions = group.Versions.ToList(),
            EolDate = group.MostAtRisk.EolDate,
            IsEol = group.MostAtRisk.IsEol,
            FindingKey = findingKey,
            LinkedTicket = LinkOf(links, FindingKind.EolRuntime, findingKey)
        };
    }
}
