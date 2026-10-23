using Sentinel.Application.TechHealth.Remediation;
using Sentinel.Application.TechHealth.Suppressions;
using Sentinel.Application.Tickets;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.TechHealth;

public static class ProjectMapper
{
    public static ProjectDto ToDto(Project project) => ToDto(project, []);

    public static ProjectDto ToDto(Project project, IReadOnlyList<FindingTicketRow> findingTickets,
        IReadOnlyList<VulnerabilitySuppression>? suppressions = null,
        VulnerabilityRemediation? remediation = null, bool remediationAvailable = false)
    {
        IReadOnlyDictionary<(FindingKind, string), FindingTicketDto> links = IndexLinks(findingTickets);
        IReadOnlyDictionary<string, SuppressionDto> suppressionsByKey = (suppressions ?? [])
            .ToDictionary(suppression => suppression.FindingKey, SuppressionMapper.ToDto);
        IReadOnlyList<(Dependency Dependency, Vulnerability Vulnerability)> remediableFindings =
            RemediationRules.RemediableFindings(project.Dependencies ?? [], suppressionsByKey.Keys.ToHashSet());

        return new ProjectDto
        {
            Id = project.Id,
            Name = project.Name,
            RepositoryUrl = project.RepositoryUrl,
            Branch = project.Branch,
            RootPath = project.RootPath,
            RepositoryType = project.RepositoryType.ToString(),
            LastScanAt = project.LastScanAt,
            LastScanError = project.LastScanError,
            HealthScore = project.HealthScore,
            HealthGrade = project.HealthGrade,
            Coverage = project.Coverage.ToString(),
            ScanFrequency = project.ScanFrequency.ToString(),
            RemediationAvailable = remediationAvailable,
            RemediableVulnerabilities = remediableFindings.Count,
            RemediationIncludesMajorUpgrade = remediableFindings
                .Any(finding => RemediationRules.IsMajorUpgrade(finding.Dependency, finding.Vulnerability)),
            Remediation = remediation == null ? null : RemediationMapper.ToDto(remediation),
            TotalDependencies = project.Dependencies?.Count ?? 0,
            CriticalVulnerabilities = project.Dependencies?
                .SelectMany(dependency => dependency.Vulnerabilities)
                .Count(vulnerability => vulnerability.Severity == VulnerabilitySeverity.Critical) ?? 0,
            TotalVulnerabilities = project.Dependencies?
                .SelectMany(dependency => dependency.Vulnerabilities)
                .Count() ?? 0,
            KnownExploitedVulnerabilities = project.Dependencies?
                .SelectMany(dependency => dependency.Vulnerabilities)
                .Count(vulnerability => vulnerability.IsKnownExploited) ?? 0,
            Dependencies = project.Dependencies?
                .Select(dependency => ToDto(dependency, links, suppressionsByKey))
                .ToList() ?? [],
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
        IReadOnlyDictionary<(FindingKind, string), FindingTicketDto> links,
        IReadOnlyDictionary<string, SuppressionDto> suppressionsByKey)
    {
        string findingKey = FindingKeys.ForDependency(dependency.Ecosystem, dependency.Name);

        return new DependencyDto
        {
            Id = dependency.Id,
            Name = dependency.Name,
            CurrentVersion = dependency.CurrentVersion,
            LatestVersion = dependency.LatestVersion,
            Type = dependency.Type.ToString(),
            IsDirect = dependency.IsDirect,
            Ecosystem = dependency.Ecosystem.ToString(),
            Status = dependency.Status.ToString(),
            IsOutdated = FindingRules.IsOutdated(dependency),
            IsVersionPinned = dependency.IsVersionPinned,
            ManifestPath = dependency.ManifestPath,
            FindingKey = findingKey,
            LinkedTicket = LinkOf(links, FindingKind.OutdatedDependency, findingKey),
            Vulnerabilities = dependency.Vulnerabilities
                .Select(vulnerability => ToDto(dependency, vulnerability, links, suppressionsByKey))
                .ToList()
        };
    }

    private static VulnerabilityDto ToDto(Dependency dependency, Vulnerability vulnerability,
        IReadOnlyDictionary<(FindingKind, string), FindingTicketDto> links,
        IReadOnlyDictionary<string, SuppressionDto> suppressionsByKey)
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
            EpssScore = vulnerability.EpssScore,
            EpssPercentile = vulnerability.EpssPercentile,
            IsKnownExploited = vulnerability.IsKnownExploited,
            IsMaliciousPackage = VulnerabilityRiskCalculator.IsMaliciousPackage(vulnerability),
            Priority = VulnerabilityRiskCalculator.Prioritize(vulnerability, dependency.Type).ToString(),
            FindingKey = findingKey,
            LinkedTicket = LinkOf(links, FindingKind.Vulnerability, findingKey),
            Suppression = suppressionsByKey.GetValueOrDefault(findingKey)
        };
    }

    private static RuntimeDto ToDto(RuntimeGroup group,
        IReadOnlyDictionary<(FindingKind, string), FindingTicketDto> links)
    {
        string findingKey = FindingKeys.ForRuntime(group.MostAtRisk.Name);
        RuntimeEolAssessment assessment = RuntimeEolAssessment.Of(group.MostAtRisk, DateTime.UtcNow);

        return new RuntimeDto
        {
            Id = group.MostAtRisk.Id,
            Name = group.MostAtRisk.Name,
            Version = group.MostAtRisk.Version,
            Versions = group.Versions.ToList(),
            EolDate = group.MostAtRisk.EolDate,
            IsEol = group.MostAtRisk.IsEol,
            IsMinimumConstraint = group.MostAtRisk.IsMinimumConstraint,
            EolStatus = assessment.Status.ToString(),
            DaysRemaining = assessment.DaysRemaining,
            EolProgressPercent = assessment.ProgressPercent,
            FindingKey = findingKey,
            LinkedTicket = LinkOf(links, FindingKind.EolRuntime, findingKey)
        };
    }
}
