using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Entities;

namespace Sentinel.Application.Exports;
internal sealed class ExportLabels(ILocalizer localizer)
{
    public required string Culture { get; init; }
    public required string DateFormat { get; init; }
    public required string StampDateFormat { get; init; }
    public required string TechHealthSlug { get; init; }

    public required string[] TicketHeaders { get; init; }
    public required string[] RecapHeaders { get; init; }
    public required string[] RuntimeHeaders { get; init; }
    public required string[] DepHeaders { get; init; }
    public required string[] VulnHeaders { get; init; }

    public required string TitleTickets { get; init; }
    public required string TitleTechHealth { get; init; }

    public required string SheetTickets { get; init; }
    public required string SheetRecap { get; init; }

    public required string SubjectTickets { get; init; }
    public required string SubjectTechHealth { get; init; }

    public required string SectionRuntimes { get; init; }
    public required string SectionDependencies { get; init; }
    public required string SectionVulnerabilities { get; init; }

    public required string GeneratedOn { get; init; }
    public required string AtWord { get; init; }
    public required string TotalWord { get; init; }
    public required string UnitTickets { get; init; }
    public required string ExportTruncated { get; init; }
    public required string UnitProjects { get; init; }

    public required string NoRuntimes { get; init; }
    public required string NoDependencies { get; init; }
    public required string NoVulnerabilities { get; init; }
    public required string GradeNotAvailable { get; init; }

    public required string RuntimeActive { get; init; }
    public required string RuntimeImminentEol { get; init; }
    public required string RuntimeSoonEol { get; init; }
    public required string RuntimeEol { get; init; }
    public required string RuntimeUnknown { get; init; }

    public static ExportLabels For(ILocalizer localizer, string culture)
    {
        string Text(string key) => localizer.Get(culture, key);

        return new ExportLabels(localizer)
        {
            Culture = culture,
            DateFormat = Text("exports.date_format"),
            StampDateFormat = Text("exports.stamp_date_format"),
            TechHealthSlug = Text("exports.tech_health.slug"),
            TicketHeaders =
            [
                Text("exports.header.ticket.reference"),
                Text("exports.header.ticket.title"),
                Text("exports.header.ticket.status"),
                Text("exports.header.ticket.priority"),
                Text("exports.header.ticket.type"),
                Text("exports.header.ticket.assignee"),
                Text("exports.header.ticket.project"),
                Text("exports.header.ticket.created_by"),
                Text("exports.header.ticket.created_on"),
                Text("exports.header.ticket.updated_on")
            ],
            RecapHeaders =
            [
                Text("exports.header.recap.project"),
                Text("exports.header.recap.grade"),
                Text("exports.header.recap.score"),
                Text("exports.header.recap.dependencies"),
                Text("exports.header.recap.to_update"),
                Text("exports.header.recap.vulnerable"),
                Text("exports.header.recap.critical"),
                Text("exports.header.recap.obsolete_runtimes"),
                Text("exports.header.recap.last_scan")
            ],
            RuntimeHeaders =
            [
                Text("exports.header.runtime.runtime"),
                Text("exports.header.runtime.version"),
                Text("exports.header.runtime.support_ends"),
                Text("exports.header.runtime.status")
            ],
            DepHeaders =
            [
                Text("exports.header.dependency.name"),
                Text("exports.header.dependency.current_version"),
                Text("exports.header.dependency.latest_version"),
                Text("exports.header.dependency.ecosystem"),
                Text("exports.header.dependency.type"),
                Text("exports.header.dependency.status"),
                Text("exports.header.dependency.vulnerabilities")
            ],
            VulnHeaders =
            [
                Text("exports.header.vulnerability.cve"),
                Text("exports.header.vulnerability.cvss"),
                Text("exports.header.vulnerability.severity"),
                Text("exports.header.vulnerability.dependency"),
                Text("exports.header.vulnerability.fix"),
                Text("exports.header.vulnerability.description")
            ],
            TitleTickets = Text("exports.tickets.title"),
            TitleTechHealth = Text("exports.tech_health.title"),
            SheetTickets = Text("exports.tickets.sheet"),
            SheetRecap = Text("exports.recap.sheet"),
            SubjectTickets = Text("exports.tickets.subject"),
            SubjectTechHealth = Text("exports.tech_health.subject"),
            SectionRuntimes = Text("exports.section.runtimes"),
            SectionDependencies = Text("exports.section.dependencies"),
            SectionVulnerabilities = Text("exports.section.vulnerabilities"),
            GeneratedOn = Text("exports.generated_on"),
            AtWord = Text("exports.at"),
            TotalWord = Text("exports.total"),
            UnitTickets = Text("exports.unit.tickets"),
            ExportTruncated = Text("exports.truncated"),
            UnitProjects = Text("exports.unit.projects"),
            NoRuntimes = Text("exports.empty.runtimes"),
            NoDependencies = Text("exports.empty.dependencies"),
            NoVulnerabilities = Text("exports.empty.vulnerabilities"),
            GradeNotAvailable = Text("exports.grade_not_available"),
            RuntimeActive = Text("exports.runtime.active"),
            RuntimeImminentEol = Text("exports.runtime.imminent_eol"),
            RuntimeSoonEol = Text("exports.runtime.soon_eol"),
            RuntimeEol = Text("exports.runtime.eol"),
            RuntimeUnknown = Text("exports.runtime.unknown")
        };
    }

    public string Translate(TicketPriority priority) => priority switch
    {
        TicketPriority.Low => Text("exports.ticket_priority.low"),
        TicketPriority.Medium => Text("exports.ticket_priority.medium"),
        TicketPriority.High => Text("exports.ticket_priority.high"),
        TicketPriority.Critical => Text("exports.ticket_priority.critical"),
        _ => priority.ToString(),
    };

    public string Translate(TicketStatus status) => status switch
    {
        TicketStatus.New => Text("exports.ticket_status.new"),
        TicketStatus.InProgress => Text("exports.ticket_status.in_progress"),
        TicketStatus.Testing => Text("exports.ticket_status.testing"),
        TicketStatus.Resolved => Text("exports.ticket_status.resolved"),
        TicketStatus.Closed => Text("exports.ticket_status.closed"),
        _ => status.ToString(),
    };

    public string Translate(TicketType type) => type switch
    {
        TicketType.Feature => Text("exports.ticket_type.feature"),
        TicketType.Security => Text("exports.ticket_type.security"),
        TicketType.Bug => Text("exports.ticket_type.bug"),
        _ => type.ToString(),
    };

    public string Translate(DependencyStatus status) => status switch
    {
        DependencyStatus.UpToDate => Text("exports.dependency_status.up_to_date"),
        DependencyStatus.MinorUpdate => Text("exports.dependency_status.minor_update"),
        DependencyStatus.MajorUpdate => Text("exports.dependency_status.major_update"),
        DependencyStatus.EOL => Text("exports.dependency_status.eol"),
        DependencyStatus.Vulnerable => Text("exports.dependency_status.vulnerable"),
        _ => status.ToString(),
    };

    public string Translate(VulnerabilitySeverity severity) => severity switch
    {
        VulnerabilitySeverity.Critical => Text("exports.severity.critical"),
        VulnerabilitySeverity.High => Text("exports.severity.high"),
        VulnerabilitySeverity.Medium => Text("exports.severity.medium"),
        VulnerabilitySeverity.Low => Text("exports.severity.low"),
        _ => severity.ToString(),
    };

    public string Translate(DependencyType type) => type switch
    {
        DependencyType.Prod => Text("exports.dependency_type.prod"),
        DependencyType.Dev => Text("exports.dependency_type.dev"),
        _ => type.ToString(),
    };

    private string Text(string key) => localizer.Get(Culture, key);
}
