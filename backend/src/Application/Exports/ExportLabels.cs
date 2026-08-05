using Sentinel.Domain.Abstractions;

namespace Sentinel.Application.Exports;
internal sealed class ExportLabels
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
    public required string RuntimeSoonEol { get; init; }
    public required string RuntimeEol { get; init; }

    public static ExportLabels For(ILocalizer localizer, string culture)
    {
        string Text(string key) => localizer.Get(culture, key);

        return new ExportLabels
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
            RuntimeSoonEol = Text("exports.runtime.soon_eol"),
            RuntimeEol = Text("exports.runtime.eol")
        };
    }
}
