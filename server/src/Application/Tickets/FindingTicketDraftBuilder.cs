using System.Globalization;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.Tickets;

public sealed class FindingTicketDraftBuilder(ILocalizer localizer, string culture)
{
    private const int TitleMaxLength = 500;
    private const string DateFormat = "yyyy-MM-dd";

    public FindingTicketDraft ForVulnerability(Dependency dependency, Vulnerability vulnerability)
    {
        string reference = vulnerability.CveAlias ?? vulnerability.CveId;

        Dictionary<string, string> parameters = new()
        {
            ["reference"] = reference,
            ["package"] = dependency.Name,
            ["ecosystem"] = dependency.Ecosystem.ToString(),
            ["version"] = dependency.CurrentVersion,
            ["fixedVersion"] = vulnerability.FixedVersion ?? Unknown(),
            ["cvss"] = vulnerability.CvssScore.ToString("0.0", CultureInfo.InvariantCulture),
            ["severity"] = vulnerability.Severity.ToString(),
            ["summary"] = vulnerability.Description
        };

        return new FindingTicketDraft(
            Title("tickets.finding_draft.vulnerability_title", parameters),
            localizer.Get(culture, "tickets.finding_draft.vulnerability_description", parameters),
            PriorityOf(vulnerability.Severity),
            TicketType.Security);
    }

    public FindingTicketDraft ForDependency(Dependency dependency)
    {
        bool isEndOfLife = dependency.Status == DependencyStatus.EOL;

        Dictionary<string, string> parameters = new()
        {
            ["package"] = dependency.Name,
            ["ecosystem"] = dependency.Ecosystem.ToString(),
            ["version"] = dependency.CurrentVersion,
            ["latestVersion"] = dependency.LatestVersion ?? Unknown()
        };

        return new FindingTicketDraft(
            Title(isEndOfLife
                ? "tickets.finding_draft.dependency_eol_title"
                : "tickets.finding_draft.dependency_title", parameters),
            localizer.Get(culture, "tickets.finding_draft.dependency_description", parameters),
            isEndOfLife ? TicketPriority.High : PriorityOf(FindingRules.UpdateStatusOf(dependency)),
            TicketType.Maintenance);
    }

    public FindingTicketDraft ForRuntime(RuntimeGroup group)
    {
        Dictionary<string, string> parameters = new()
        {
            ["runtime"] = group.MostAtRisk.Name,
            ["version"] = group.MostAtRisk.Version,
            ["versions"] = string.Join(", ", group.Versions),
            ["eolDate"] = group.MostAtRisk.EolDate?.ToString(DateFormat, CultureInfo.InvariantCulture) ?? Unknown()
        };

        return new FindingTicketDraft(
            Title("tickets.finding_draft.runtime_title", parameters),
            localizer.Get(culture, "tickets.finding_draft.runtime_description", parameters),
            TicketPriority.High,
            TicketType.Maintenance);
    }

    private string Title(string key, IReadOnlyDictionary<string, string> parameters)
    {
        string title = localizer.Get(culture, key, parameters);

        return title.Length > TitleMaxLength ? title[..TitleMaxLength] : title;
    }

    private string Unknown() => localizer.Get(culture, "tickets.finding_draft.unknown");

    private static TicketPriority PriorityOf(VulnerabilitySeverity severity) => severity switch
    {
        VulnerabilitySeverity.Critical => TicketPriority.Critical,
        VulnerabilitySeverity.High => TicketPriority.High,
        VulnerabilitySeverity.Medium => TicketPriority.Medium,
        _ => TicketPriority.Low
    };

    private static TicketPriority PriorityOf(DependencyStatus updateStatus) => updateStatus switch
    {
        DependencyStatus.MajorUpdate => TicketPriority.Medium,
        _ => TicketPriority.Low
    };
}
