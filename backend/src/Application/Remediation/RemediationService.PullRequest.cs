using Sentinel.Application.Security;
using Sentinel.Application.TechHealth.Scan;
using Microsoft.Extensions.Logging;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.DTOs.Remediation;
using Sentinel.Domain.Git;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Remediation;
public partial class RemediationService
{
    private static string BuildTitle(List<RemediationTarget> targets)
        => targets.Count == 1
            ? $"Mise à jour de {targets[0].Name} vers {targets[0].TargetVersion}"
            : $"Correction de {targets.Count} dépendances vulnérables";

    private static string BuildBody(List<RemediationTarget> targets, List<StaleLockfile> staleLockfiles)
    {
        System.Text.StringBuilder sb = new();
        sb.AppendLine("Pull request générée automatiquement par Sentinel pour corriger des vulnérabilités connues.");
        sb.AppendLine();
        sb.AppendLine("| Dépendance | Actuelle | Cible | CVE |");
        sb.AppendLine("| --- | --- | --- | --- |");

        foreach (RemediationTarget t in targets)
        {
            string breaking = t.IsBreaking ? " ⚠️ (changement majeur)" : "";
            sb.AppendLine($"| {t.Name}{breaking} | {t.CurrentVersion} | {t.TargetVersion} | {string.Join(", ", t.CveIds)} |");
        }

        sb.AppendLine();

        if (staleLockfiles.Count > 0)
        {
            sb.AppendLine("### ⚠️ Fichiers de verrouillage à régénérer avant fusion");
            sb.AppendLine();
            sb.AppendLine("Seuls les manifestes ont été modifiés. Régénérez les fichiers de verrouillage pour garder des installations reproductibles :");
            sb.AppendLine();
            sb.AppendLine("| Fichier | Commande |");
            sb.AppendLine("| --- | --- |");
            foreach (StaleLockfile lockfile in staleLockfiles)
                sb.AppendLine($"| `{lockfile.Path}` | `{lockfile.Command}` |");
            sb.AppendLine();
            sb.AppendLine("La CI du dépôt régénère généralement ces fichiers lors de l'étape d'installation.");
        }
        else
        {
            sb.AppendLine("Pensez à vérifier la CI avant de fusionner.");
        }

        return sb.ToString();
    }

}
