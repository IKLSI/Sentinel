using ClosedXML.Excel;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Exports;
public partial class ExportService
{
    private static string TranslateTicketPriority(string priority, bool en) => priority switch
    {
        "Low" => en ? "Low" : "Faible",
        "Medium" => en ? "Medium" : "Moyen",
        "High" => en ? "High" : "Élevé",
        "Critical" => en ? "Critical" : "Critique",
        _ => priority,
    };

    private static string TranslateTicketType(string type, bool en) => type switch
    {
        "Feature" => en ? "Feature" : "Fonctionnalité",
        "Security" => en ? "Security" : "Sécurité",
        "Bug" => en ? "Bug" : "Bug",
        _ => type,
    };

    private static string TranslateDependencyStatus(string status, bool en) => status switch
    {
        "UpToDate" => en ? "Up to date" : "À jour",
        "MinorUpdate" => en ? "Minor update" : "Mise à jour mineure",
        "MajorUpdate" => en ? "Major update" : "Mise à jour majeure",
        "EOL" => en ? "Obsolete" : "Obsolète",
        "Vulnerable" => en ? "Vulnerable" : "Vulnérable",
        _ => status,
    };

    private static string TranslateSeverity(string severity, bool en) => severity switch
    {
        "Critical" => en ? "Critical" : "Critique",
        "High" => en ? "High" : "Élevé",
        "Medium" => en ? "Medium" : "Moyen",
        "Low" => en ? "Low" : "Faible",
        _ => severity,
    };

    private static string TranslateDependencyType(string type, bool en) => type switch
    {
        "Prod" => en ? "Production" : "Production",
        "Dev" => en ? "Development" : "Développement",
        _ => type,
    };

}
