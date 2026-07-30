namespace Sentinel.Application.Exports;
public partial class ExportService
{
    private string Text(ExportLabels labels, string key) => localizer.Get(labels.Culture, key);

    private string TranslateTicketPriority(string priority, ExportLabels labels) => priority switch
    {
        "Low" => Text(labels, "exports.ticket_priority.low"),
        "Medium" => Text(labels, "exports.ticket_priority.medium"),
        "High" => Text(labels, "exports.ticket_priority.high"),
        "Critical" => Text(labels, "exports.ticket_priority.critical"),
        _ => priority,
    };

    private string TranslateTicketType(string type, ExportLabels labels) => type switch
    {
        "Feature" => Text(labels, "exports.ticket_type.feature"),
        "Security" => Text(labels, "exports.ticket_type.security"),
        "Bug" => Text(labels, "exports.ticket_type.bug"),
        _ => type,
    };

    private string TranslateDependencyStatus(string status, ExportLabels labels) => status switch
    {
        "UpToDate" => Text(labels, "exports.dependency_status.up_to_date"),
        "MinorUpdate" => Text(labels, "exports.dependency_status.minor_update"),
        "MajorUpdate" => Text(labels, "exports.dependency_status.major_update"),
        "EOL" => Text(labels, "exports.dependency_status.eol"),
        "Vulnerable" => Text(labels, "exports.dependency_status.vulnerable"),
        _ => status,
    };

    private string TranslateSeverity(string severity, ExportLabels labels) => severity switch
    {
        "Critical" => Text(labels, "exports.severity.critical"),
        "High" => Text(labels, "exports.severity.high"),
        "Medium" => Text(labels, "exports.severity.medium"),
        "Low" => Text(labels, "exports.severity.low"),
        _ => severity,
    };

    private string TranslateDependencyType(string type, ExportLabels labels) => type switch
    {
        "Prod" => Text(labels, "exports.dependency_type.prod"),
        "Dev" => Text(labels, "exports.dependency_type.dev"),
        _ => type,
    };

}
