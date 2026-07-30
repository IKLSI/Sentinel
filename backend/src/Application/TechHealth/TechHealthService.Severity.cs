using Sentinel.Application.Security;
using Sentinel.Application.TechHealth.Scan;
using Hangfire;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net.Http.Json;
using System.Text.Json;
using Sentinel.Application.Billing;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Settings;
using Sentinel.Domain.DTOs.TechHealth;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.TechHealth;

public partial class TechHealthService
{
    private static (decimal cvss, VulnerabilitySeverity severity) ExtractSeverity(JsonElement vuln)
    {
        // 1. database_specific.cvss.baseScore (GitHub Advisory — score numérique direct)
        if (vuln.TryGetProperty("database_specific", out JsonElement dbSpecific))
        {
            if (dbSpecific.TryGetProperty("cvss", out JsonElement cvssObj) &&
                cvssObj.TryGetProperty("baseScore", out JsonElement baseScoreProp) &&
                baseScoreProp.TryGetDecimal(out decimal score))
            {
                return (score, ScoreToSeverity(score));
            }

            if (dbSpecific.TryGetProperty("severity", out JsonElement sevStr))
            {
                VulnerabilitySeverity sev = sevStr.GetString()?.ToUpperInvariant() switch
                {
                    "CRITICAL" => VulnerabilitySeverity.Critical,
                    "HIGH" => VulnerabilitySeverity.High,
                    "MODERATE" or "MEDIUM" => VulnerabilitySeverity.Medium,
                    "LOW" => VulnerabilitySeverity.Low,
                    _ => VulnerabilitySeverity.Medium
                };
                return (SeverityToDefaultScore(sev), sev);
            }
        }

        // 2. Fallback heuristique sur le vecteur CVSS v3
        if (vuln.TryGetProperty("severity", out JsonElement severityArr))
        {
            foreach (JsonElement sev in severityArr.EnumerateArray())
            {
                if (sev.TryGetProperty("score", out JsonElement scoreProp))
                {
                    string? vector = scoreProp.GetString();
                    if (vector != null)
                    {
                        VulnerabilitySeverity estimatedSev = EstimateSeverityFromVector(vector);
                        return (SeverityToDefaultScore(estimatedSev), estimatedSev);
                    }
                }
            }
        }

        return (SeverityToDefaultScore(VulnerabilitySeverity.Medium), VulnerabilitySeverity.Medium);
    }

    private static VulnerabilitySeverity ScoreToSeverity(decimal score) => score switch
    {
        >= 9.0m => VulnerabilitySeverity.Critical,
        >= 7.0m => VulnerabilitySeverity.High,
        >= 4.0m => VulnerabilitySeverity.Medium,
        _ => VulnerabilitySeverity.Low
    };

    private static decimal SeverityToDefaultScore(VulnerabilitySeverity severity) => severity switch
    {
        VulnerabilitySeverity.Critical => 9.5m,
        VulnerabilitySeverity.High     => 7.5m,
        VulnerabilitySeverity.Medium   => 5.0m,
        _                              => 2.0m
    };

    private static VulnerabilitySeverity EstimateSeverityFromVector(string vector)
    {
        bool critConfInt = vector.Contains("/C:H") && vector.Contains("/I:H");
        bool highImpact = vector.Contains("/C:H") || vector.Contains("/I:H") || vector.Contains("/A:H");
        bool lowPriv = vector.Contains("/PR:N") || vector.Contains("/PR:L");

        if (critConfInt && lowPriv) return VulnerabilitySeverity.Critical;
        if (highImpact) return VulnerabilitySeverity.High;
        if (vector.Contains("/C:L") || vector.Contains("/I:L") || vector.Contains("/A:L"))
            return VulnerabilitySeverity.Medium;
        return VulnerabilitySeverity.Low;
    }

    private static string? ExtractFixedVersion(JsonElement vuln, string packageName)
    {
        if (!vuln.TryGetProperty("affected", out JsonElement affected)) return null;

        foreach (JsonElement affectedEntry in affected.EnumerateArray())
        {
            if (affectedEntry.TryGetProperty("package", out JsonElement pkg))
            {
                string? name = pkg.TryGetProperty("name", out JsonElement n) ? n.GetString() : null;
                if (name != null && !name.Equals(packageName, StringComparison.OrdinalIgnoreCase)) continue;
            }

            if (!affectedEntry.TryGetProperty("ranges", out JsonElement ranges)) continue;

            foreach (JsonElement range in ranges.EnumerateArray())
            {
                if (!range.TryGetProperty("events", out JsonElement events)) continue;

                foreach (JsonElement evt in events.EnumerateArray())
                {
                    if (evt.TryGetProperty("fixed", out JsonElement fixedProp))
                        return fixedProp.GetString();
                }
            }
        }

        return null;
    }

}
