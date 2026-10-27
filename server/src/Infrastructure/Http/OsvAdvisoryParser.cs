using System.Text.Json;
using System.Text.RegularExpressions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Parsing;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Infrastructure.Http;

internal static partial class OsvAdvisoryParser
{
    private const string MaliciousPackagePrefix = "MAL-";
    private static readonly string[] OrderedRangeTypes = ["ECOSYSTEM", "SEMVER"];

    public static VulnerabilityAdvisory Parse(string id, JsonElement vulnerability)
    {
        (decimal cvss, VulnerabilitySeverity severity) = ExtractSeverity(vulnerability);

        if (id.StartsWith(MaliciousPackagePrefix, StringComparison.OrdinalIgnoreCase))
        {
            severity = VulnerabilitySeverity.Critical;
            cvss = Math.Max(cvss, DefaultScore(VulnerabilitySeverity.Critical));
        }

        string summary = vulnerability.StringProperty("summary") ?? string.Empty;

        bool isWithdrawn = vulnerability.TryGetProperty("withdrawn", out JsonElement withdrawn)
            && withdrawn.ValueKind == JsonValueKind.String
            && !string.IsNullOrWhiteSpace(withdrawn.GetString());

        return new VulnerabilityAdvisory(id, cvss, severity, summary, ExtractFixedVersions(vulnerability),
            isWithdrawn, ExtractCveAlias(id, vulnerability), ExtractAffectedRanges(vulnerability));
    }

    private static string? ExtractCveAlias(string id, JsonElement vulnerability)
    {
        if (CveIdRegex().IsMatch(id)) return id;

        if (!vulnerability.TryGetProperty("aliases", out JsonElement aliases) ||
            aliases.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        foreach (JsonElement alias in aliases.EnumerateArray())
        {
            if (alias.GetString() is { } value && CveIdRegex().IsMatch(value)) return value;
        }

        return null;
    }

    private static (decimal Cvss, VulnerabilitySeverity Severity) ExtractSeverity(JsonElement vulnerability)
    {
        if (TryReadPublishedScore(vulnerability, out decimal publishedScore))
            return (publishedScore, ScoreToSeverity(publishedScore));

        List<string> vectors = ReadVectors(vulnerability);

        if (ComputeFirstScore(vectors, "CVSS:3") is { } version3Score)
            return (version3Score, ScoreToSeverity(version3Score));

        if (TryReadQualitativeSeverity(vulnerability, out VulnerabilitySeverity qualitative))
            return (DefaultScore(qualitative), qualitative);

        if (ComputeFirstScore(vectors, "CVSS:4") is { } version4Score)
            return (version4Score, ScoreToSeverity(version4Score));

        return (DefaultScore(VulnerabilitySeverity.Medium), VulnerabilitySeverity.Medium);
    }

    private static decimal DefaultScore(VulnerabilitySeverity severity) => severity switch
    {
        VulnerabilitySeverity.Critical => 9.5m,
        VulnerabilitySeverity.High     => 7.5m,
        VulnerabilitySeverity.Medium   => 5.0m,
        _                              => 2.0m
    };

    private static bool TryReadPublishedScore(JsonElement vulnerability, out decimal score)
    {
        score = 0;

        return vulnerability.TryGetProperty("database_specific", out JsonElement databaseSpecific)
            && databaseSpecific.TryGetProperty("cvss", out JsonElement cvss)
            && cvss.TryGetProperty("baseScore", out JsonElement baseScore)
            && baseScore.TryGetDecimal(out score);
    }

    private static List<string> ReadVectors(JsonElement vulnerability) =>
        vulnerability.TryGetProperty("severity", out JsonElement severities)
        && severities.ValueKind == JsonValueKind.Array
            ? severities.EnumerateArray()
                .Select(entry => entry.StringProperty("score"))
                .OfType<string>()
                .ToList()
            : [];

    private static bool TryReadQualitativeSeverity(JsonElement vulnerability, out VulnerabilitySeverity severity)
    {
        severity = VulnerabilitySeverity.Medium;

        if (!vulnerability.TryGetProperty("database_specific", out JsonElement databaseSpecific)
            || databaseSpecific.ValueKind != JsonValueKind.Object
            || !databaseSpecific.TryGetProperty("severity", out JsonElement qualitative))
        {
            return false;
        }

        severity = qualitative.GetString()?.ToUpperInvariant() switch
        {
            "CRITICAL" => VulnerabilitySeverity.Critical,
            "HIGH" => VulnerabilitySeverity.High,
            "MODERATE" or "MEDIUM" => VulnerabilitySeverity.Medium,
            "LOW" => VulnerabilitySeverity.Low,
            _ => VulnerabilitySeverity.Medium
        };

        return true;
    }

    private static decimal? ComputeFirstScore(IEnumerable<string> vectors, string versionPrefix) => vectors
        .Where(vector => vector.StartsWith(versionPrefix, StringComparison.OrdinalIgnoreCase))
        .Select(CvssVector.TryComputeBaseScore)
        .FirstOrDefault(computed => computed != null);

    private static VulnerabilitySeverity ScoreToSeverity(decimal score) => score switch
    {
        >= 9.0m => VulnerabilitySeverity.Critical,
        >= 7.0m => VulnerabilitySeverity.High,
        >= 4.0m => VulnerabilitySeverity.Medium,
        _ => VulnerabilitySeverity.Low
    };

    [GeneratedRegex(@"^CVE-\d{4}-\d{4,}$", RegexOptions.IgnoreCase)]
    private static partial Regex CveIdRegex();

    private static Dictionary<string, string> ExtractFixedVersions(JsonElement vulnerability)
    {
        Dictionary<string, string> fixedVersions = new(StringComparer.OrdinalIgnoreCase);

        if (!vulnerability.TryGetProperty("affected", out JsonElement affected)) return fixedVersions;

        foreach (JsonElement affectedEntry in affected.EnumerateArray())
        {
            string? fixedVersion = ExtractFirstFixedVersion(affectedEntry);
            if (fixedVersion == null) continue;

            string packageKey = TryReadPackageKey(affectedEntry, out string key) ? key : string.Empty;
            fixedVersions.TryAdd(packageKey, fixedVersion);
        }

        return fixedVersions;
    }

    private static string? ExtractFirstFixedVersion(JsonElement affectedEntry)
    {
        foreach (JsonElement events in OrderedRangeEvents(affectedEntry))
        {
            foreach (JsonElement occurrence in events.EnumerateArray())
            {
                if (occurrence.TryGetProperty("fixed", out JsonElement fixedProperty))
                    return fixedProperty.GetString();
            }
        }

        return null;
    }

    private static Dictionary<string, IReadOnlyList<AffectedRange>> ExtractAffectedRanges(JsonElement vulnerability)
    {
        Dictionary<string, List<AffectedRange>> rangesByPackage = new(StringComparer.OrdinalIgnoreCase);

        if (!vulnerability.TryGetProperty("affected", out JsonElement affected)) return new();

        foreach (JsonElement affectedEntry in affected.EnumerateArray())
        {
            if (!TryReadPackageKey(affectedEntry, out string key)) continue;

            foreach (JsonElement events in OrderedRangeEvents(affectedEntry))
            {
                if (!rangesByPackage.TryGetValue(key, out List<AffectedRange>? packageRanges))
                    rangesByPackage[key] = packageRanges = new List<AffectedRange>();

                packageRanges.AddRange(ReadRanges(events));
            }
        }

        return rangesByPackage.ToDictionary(pair => pair.Key, pair => (IReadOnlyList<AffectedRange>)pair.Value,
            StringComparer.OrdinalIgnoreCase);
    }

    private static bool TryReadPackageKey(JsonElement affectedEntry, out string key)
    {
        key = string.Empty;

        if (!affectedEntry.TryGetProperty("package", out JsonElement package) || package.ValueKind != JsonValueKind.Object)
            return false;
        if (package.StringProperty("name") is not { } packageName)
            return false;

        key = PackageNameNormalizer.ForVulnerabilityFeed(package.StringProperty("ecosystem"), packageName);
        return true;
    }

    private static IEnumerable<JsonElement> OrderedRangeEvents(JsonElement affectedEntry)
    {
        if (!affectedEntry.TryGetProperty("ranges", out JsonElement ranges)) yield break;

        foreach (JsonElement range in ranges.EnumerateArray())
        {
            string? type = range.StringProperty("type");
            if (!OrderedRangeTypes.Contains(type, StringComparer.OrdinalIgnoreCase)) continue;
            if (!range.TryGetProperty("events", out JsonElement events)) continue;

            yield return events;
        }
    }

    private static List<AffectedRange> ReadRanges(JsonElement events)
    {
        List<AffectedRange> ranges = new();
        string? introduced = null;

        foreach (JsonElement occurrence in events.EnumerateArray())
        {
            if (occurrence.TryGetProperty("introduced", out JsonElement introducedProperty))
            {
                introduced = introducedProperty.GetString();
            }
            else if (occurrence.TryGetProperty("fixed", out JsonElement fixedProperty))
            {
                ranges.Add(new AffectedRange(introduced, fixedProperty.GetString(), null));
                introduced = null;
            }
            else if (occurrence.TryGetProperty("last_affected", out JsonElement lastAffected))
            {
                ranges.Add(new AffectedRange(introduced, null, lastAffected.GetString()));
                introduced = null;
            }
        }

        if (introduced != null) ranges.Add(new AffectedRange(introduced, null, null));

        return ranges;
    }
}
