using ClosedXML.Excel;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Exports;
internal sealed class ExportLabels
{
    public required bool IsEn { get; init; }
    public required string DateFormat { get; init; }

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
    public required string UnitProjects { get; init; }

    public required string NoRuntimes { get; init; }
    public required string NoDependencies { get; init; }
    public required string NoVulnerabilities { get; init; }
    public required string StatusUnknown { get; init; }
    public required string GradeNotAvailable { get; init; }

    public required string RuntimeActive { get; init; }
    public required string RuntimeSoonEol { get; init; }
    public required string RuntimeEol { get; init; }

    public static ExportLabels For(bool en) => en
        ? new ExportLabels
        {
            IsEn = true,
            DateFormat = "mm/dd/yyyy",
            TicketHeaders = ["Reference", "Title", "Status", "Priority", "Type", "Assignee", "Project", "Created by", "Created on", "Updated on", "Est. hours"],
            RecapHeaders = ["Project", "Grade", "Score /100", "Dependencies", "To update", "Vulnerable", "Critical", "Obsolete runtimes", "Last scan"],
            RuntimeHeaders = ["Runtime", "Version", "Support ends", "Status"],
            DepHeaders = ["Name", "Current version", "Latest version", "Ecosystem", "Type", "Status", "Vulnerabilities"],
            VulnHeaders = ["CVE", "CVSS score", "Severity", "Dependency", "Fix", "Description"],
            TitleTickets = "Sentinel — Tickets",
            TitleTechHealth = "Sentinel — TechHealth",
            SheetTickets = "Tickets",
            SheetRecap = "Summary",
            SubjectTickets = "Tickets Export",
            SubjectTechHealth = "TechHealth Export",
            SectionRuntimes = "RUNTIMES",
            SectionDependencies = "DEPENDENCIES",
            SectionVulnerabilities = "VULNERABILITIES",
            GeneratedOn = "Generated on",
            AtWord = "at",
            TotalWord = "TOTAL",
            UnitTickets = "tickets",
            UnitProjects = "projects",
            NoRuntimes = "No runtime detected",
            NoDependencies = "No dependency detected",
            NoVulnerabilities = "No vulnerability detected",
            StatusUnknown = "Unknown",
            GradeNotAvailable = "N/A",
            RuntimeActive = "Active",
            RuntimeSoonEol = "Soon obsolete",
            RuntimeEol = "Obsolete",
        }
        : new ExportLabels
        {
            IsEn = false,
            DateFormat = "dd/mm/yyyy",
            TicketHeaders = ["Référence", "Titre", "Statut", "Priorité", "Type", "Assigné à", "Projet", "Créé par", "Créé le", "Mis à jour le", "H. estimées"],
            RecapHeaders = ["Projet", "Grade", "Score /100", "Dépendances", "À mettre à jour", "Vulnérables", "Critiques", "Runtimes obsolètes", "Dernier scan"],
            RuntimeHeaders = ["Runtime", "Version", "Fin de support", "Statut"],
            DepHeaders = ["Nom", "Version actuelle", "Dernière version", "Écosystème", "Type", "Statut", "Vulnérabilités"],
            VulnHeaders = ["CVE", "Score CVSS", "Sévérité", "Dépendance", "Correctif", "Description"],
            TitleTickets = "Sentinel — Tickets",
            TitleTechHealth = "Sentinel — TechHealth",
            SheetTickets = "Tickets",
            SheetRecap = "Récapitulatif",
            SubjectTickets = "Export Tickets",
            SubjectTechHealth = "Export TechHealth",
            SectionRuntimes = "RUNTIMES",
            SectionDependencies = "DÉPENDANCES",
            SectionVulnerabilities = "VULNÉRABILITÉS",
            GeneratedOn = "Généré le",
            AtWord = "à",
            TotalWord = "TOTAL",
            UnitTickets = "ticket(s)",
            UnitProjects = "projet(s)",
            NoRuntimes = "Aucun runtime détecté",
            NoDependencies = "Aucune dépendance détectée",
            NoVulnerabilities = "Aucune vulnérabilité détectée",
            StatusUnknown = "Inconnu",
            GradeNotAvailable = "N/A",
            RuntimeActive = "Actif",
            RuntimeSoonEol = "Bientôt obsolète",
            RuntimeEol = "Obsolète",
        };
}
