using Sentinel.Application.Tickets;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.Dashboard.GetStats;

public static class NextActionResolver
{
    public static bool HasScanError(Project project) => HasScanError(project.Coverage, project.LastScanError);

    public static bool HasScanError(ScanCoverage coverage, string? lastScanError) =>
        coverage == ScanCoverage.Failed
        || (lastScanError != null
            && lastScanError != ErrorCodes.ScanVulnerabilityDataIncomplete
            && lastScanError != ErrorCodes.ScanInventoryIncomplete);

    public static NextActionDto? Resolve(Project project, IReadOnlyList<OpenTicketRow> projectTickets,
        IReadOnlyList<RuntimeDeadline> deadlines)
    {
        if (HasScanError(project)) return new NextActionDto { Kind = NextActionKind.FixScan };

        return SevereVulnerabilityUpdate(project)
            ?? UnassignedCriticalTicket(projectTickets)
            ?? RuntimeMigration(project, deadlines)
            ?? FixableVulnerabilityUpdate(project)
            ?? MajorUpdate(project);
    }

    private static NextActionDto? SevereVulnerabilityUpdate(Project project)
    {
        var severe = project.Dependencies
            .SelectMany(dependency => dependency.Vulnerabilities.Select(vulnerability => new
            {
                Dependency = dependency,
                Vulnerability = vulnerability,
                Priority = VulnerabilityRiskCalculator.Prioritize(vulnerability, dependency.Type),
            }))
            .Where(entry => entry.Priority <= RiskPriority.High)
            .OrderBy(entry => entry.Priority)
            .ThenByDescending(entry => entry.Vulnerability.CvssScore)
            .FirstOrDefault();

        return severe == null
            ? null
            : Update(severe.Dependency, severe.Vulnerability.FixedVersion ?? severe.Dependency.LatestVersion);
    }

    private static NextActionDto? UnassignedCriticalTicket(IReadOnlyList<OpenTicketRow> projectTickets)
    {
        OpenTicketRow? ticket = projectTickets
            .Where(t => t.Priority == TicketPriority.Critical && !t.IsAssigned)
            .OrderBy(t => t.CreatedAt)
            .FirstOrDefault();

        return ticket == null
            ? null
            : new NextActionDto
            {
                Kind = NextActionKind.AssignTicket,
                TicketId = ticket.Id,
                TicketReference = TicketReference.For(ticket.Number),
            };
    }

    private static NextActionDto? RuntimeMigration(Project project, IReadOnlyList<RuntimeDeadline> deadlines)
    {
        RuntimeDeadline? deadline = deadlines.FirstOrDefault(d =>
            d.DaysLeft <= ParkOverviewCalculator.EndingSoonThresholdDays && d.ProjectIds.Contains(project.Id));

        return deadline == null
            ? null
            : new NextActionDto
            {
                Kind = NextActionKind.PlanRuntimeMigration,
                Target = deadline.Runtime,
                Version = deadline.Version,
            };
    }

    private static NextActionDto? FixableVulnerabilityUpdate(Project project)
    {
        var fixable = project.Dependencies
            .SelectMany(dependency => dependency.Vulnerabilities
                .Where(vulnerability => vulnerability.FixedVersion != null)
                .Select(vulnerability => new { Dependency = dependency, Vulnerability = vulnerability }))
            .OrderByDescending(entry => entry.Vulnerability.CvssScore)
            .FirstOrDefault();

        return fixable == null ? null : Update(fixable.Dependency, fixable.Vulnerability.FixedVersion);
    }

    private static NextActionDto? MajorUpdate(Project project)
    {
        Dependency? dependency = project.Dependencies
            .Where(FindingRules.IsMajorUpdateInProduction)
            .OrderBy(d => d.Name)
            .FirstOrDefault();

        return dependency == null ? null : Update(dependency, dependency.LatestVersion);
    }

    private static NextActionDto Update(Dependency dependency, string? version) => new()
    {
        Kind = NextActionKind.UpdateDependency,
        Target = dependency.Name,
        Version = version,
    };
}
