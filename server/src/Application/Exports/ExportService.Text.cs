using Sentinel.Domain.Entities;

namespace Sentinel.Application.Exports;
public partial class ExportService
{
    private string Text(ExportLabels labels, string key) => localizer.Get(labels.Culture, key);

    private string TranslateTicketPriority(TicketPriority priority, ExportLabels labels) => priority switch
    {
        TicketPriority.Low => Text(labels, "exports.ticket_priority.low"),
        TicketPriority.Medium => Text(labels, "exports.ticket_priority.medium"),
        TicketPriority.High => Text(labels, "exports.ticket_priority.high"),
        TicketPriority.Critical => Text(labels, "exports.ticket_priority.critical"),
        _ => priority.ToString(),
    };

    private string TranslateTicketStatus(TicketStatus status, ExportLabels labels) => status switch
    {
        TicketStatus.New => Text(labels, "exports.ticket_status.new"),
        TicketStatus.InProgress => Text(labels, "exports.ticket_status.in_progress"),
        TicketStatus.Testing => Text(labels, "exports.ticket_status.testing"),
        TicketStatus.Resolved => Text(labels, "exports.ticket_status.resolved"),
        TicketStatus.Closed => Text(labels, "exports.ticket_status.closed"),
        _ => status.ToString(),
    };

    private string TranslateTicketType(TicketType type, ExportLabels labels) => type switch
    {
        TicketType.Feature => Text(labels, "exports.ticket_type.feature"),
        TicketType.Security => Text(labels, "exports.ticket_type.security"),
        TicketType.Bug => Text(labels, "exports.ticket_type.bug"),
        _ => type.ToString(),
    };

    private string TranslateDependencyStatus(DependencyStatus status, ExportLabels labels) => status switch
    {
        DependencyStatus.UpToDate => Text(labels, "exports.dependency_status.up_to_date"),
        DependencyStatus.MinorUpdate => Text(labels, "exports.dependency_status.minor_update"),
        DependencyStatus.MajorUpdate => Text(labels, "exports.dependency_status.major_update"),
        DependencyStatus.EOL => Text(labels, "exports.dependency_status.eol"),
        DependencyStatus.Vulnerable => Text(labels, "exports.dependency_status.vulnerable"),
        _ => status.ToString(),
    };

    private string TranslateSeverity(VulnerabilitySeverity severity, ExportLabels labels) => severity switch
    {
        VulnerabilitySeverity.Critical => Text(labels, "exports.severity.critical"),
        VulnerabilitySeverity.High => Text(labels, "exports.severity.high"),
        VulnerabilitySeverity.Medium => Text(labels, "exports.severity.medium"),
        VulnerabilitySeverity.Low => Text(labels, "exports.severity.low"),
        _ => severity.ToString(),
    };

    private string TranslateDependencyType(DependencyType type, ExportLabels labels) => type switch
    {
        DependencyType.Prod => Text(labels, "exports.dependency_type.prod"),
        DependencyType.Dev => Text(labels, "exports.dependency_type.dev"),
        _ => type.ToString(),
    };

}
