using Sentinel.Application.Projects.GetOverview;
using Sentinel.Application.Remediation;
using Sentinel.Application.Suppressions;
using Sentinel.Application.Tickets;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.Projects;

public static class ProjectMapper
{
    private static readonly ProjectDetailContext EmptyContext = new([], [], null, false);

    public static ProjectDto ToDto(Project project) => ToDto(project, EmptyContext);

    public static ProjectDto ToDto(Project project, ProjectDetailContext context)
    {
        IReadOnlyDictionary<(FindingKind, string), FindingTicketDto> links = IndexLinks(context.FindingTickets);
        IReadOnlyDictionary<string, SuppressionDto> suppressionsByKey = IndexSuppressions(context.Suppressions);
        ProjectDto dto = ToHeaderDto<ProjectDto>(project, links, suppressionsByKey, context,
            ProjectInventoryCounts.Of(project.Dependencies));

        dto.Dependencies = ToDependencyDtos(project.Dependencies, links, suppressionsByKey);

        return dto;
    }

    public static ProjectOverviewDto ToOverviewDto(Project project, ProjectDetailContext context)
    {
        IReadOnlyDictionary<(FindingKind, string), FindingTicketDto> links = IndexLinks(context.FindingTickets);
        IReadOnlyDictionary<string, SuppressionDto> suppressionsByKey = IndexSuppressions(context.Suppressions);
        ProjectInventoryCounts counts = ProjectInventoryCounts.Of(project.Dependencies);
        counts.Dependencies = project.InventoryCounts.Dependencies;
        ProjectOverviewDto dto = ToHeaderDto<ProjectOverviewDto>(project, links, suppressionsByKey, context, counts);

        dto.VulnerableDependencies = ToDependencyDtos(project.Dependencies, links, suppressionsByKey);

        return dto;
    }

    public static List<DependencyDto> ToDependencyDtos(IEnumerable<Dependency> dependencies,
        IReadOnlyList<FindingTicketRow> findingTickets) =>
        ToDependencyDtos(dependencies, IndexLinks(findingTickets), IndexSuppressions([]));

    private static TDto ToHeaderDto<TDto>(Project project,
        IReadOnlyDictionary<(FindingKind, string), FindingTicketDto> links,
        IReadOnlyDictionary<string, SuppressionDto> suppressionsByKey, ProjectDetailContext context,
        ProjectInventoryCounts counts) where TDto : ProjectHeaderDto, new()
    {
        IReadOnlyList<(Dependency Dependency, Vulnerability Vulnerability)> remediableFindings =
            RemediationRules.RemediableFindings(project.Dependencies, suppressionsByKey.Keys.ToHashSet());

        return new TDto
        {
            Id = project.Id,
            Name = project.Name,
            RepositoryUrl = project.RepositoryUrl,
            Branch = project.Branch,
            RootPath = project.RootPath,
            RepositoryType = project.RepositoryType.ToString(),
            LastScanAt = project.LastScanAt,
            LastScanError = project.LastScanError,
            LastScanErrorDetail = project.LastScanErrorDetail,
            HealthScore = project.HealthScore,
            HealthGrade = project.HealthGrade,
            Coverage = project.Coverage.ToString(),
            ScanFrequency = project.ScanFrequency.ToString(),
            RemediationAvailable = context.RemediationAvailable,
            RemediableVulnerabilities = remediableFindings.Count,
            RemediationIncludesMajorUpgrade = remediableFindings
                .Any(finding => RemediationRules.IsMajorUpgrade(finding.Dependency, finding.Vulnerability)),
            Remediation = context.Remediation == null ? null : RemediationMapper.ToDto(context.Remediation),
            TotalDependencies = counts.Dependencies,
            CriticalVulnerabilities = counts.CriticalVulnerabilities,
            TotalVulnerabilities = counts.Vulnerabilities,
            KnownExploitedVulnerabilities = counts.KnownExploitedVulnerabilities,
            Runtimes = RuntimeGrouping.ByName(project.Runtimes).Select(group => ToDto(group, links)).ToList()
        };
    }

    private static List<DependencyDto> ToDependencyDtos(IEnumerable<Dependency> dependencies,
        IReadOnlyDictionary<(FindingKind, string), FindingTicketDto> links,
        IReadOnlyDictionary<string, SuppressionDto> suppressionsByKey) =>
        dependencies.Select(dependency => ToDto(dependency, links, suppressionsByKey)).ToList();

    private static IReadOnlyDictionary<string, SuppressionDto> IndexSuppressions(
        IReadOnlyList<VulnerabilitySuppression> suppressions) =>
        suppressions.ToDictionary(suppression => suppression.FindingKey, SuppressionMapper.ToDto);

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
        string findingKey = FindingKeys.ForVulnerability(dependency, vulnerability);

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
