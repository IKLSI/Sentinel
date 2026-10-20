namespace Sentinel.Domain.TechHealth;

public static class CvssVector
{
    private static readonly Dictionary<string, double> AttackVector = new()
    {
        ["N"] = 0.85, ["A"] = 0.62, ["L"] = 0.55, ["P"] = 0.2,
    };

    private static readonly Dictionary<string, double> AttackComplexity = new()
    {
        ["L"] = 0.77, ["H"] = 0.44,
    };

    private static readonly Dictionary<string, double> UserInteraction = new()
    {
        ["N"] = 0.85, ["R"] = 0.62,
    };

    private static readonly Dictionary<string, double> Impact = new()
    {
        ["H"] = 0.56, ["L"] = 0.22, ["N"] = 0.0,
    };

    private static readonly Dictionary<string, double> PrivilegesUnchangedScope = new()
    {
        ["N"] = 0.85, ["L"] = 0.62, ["H"] = 0.27,
    };

    private static readonly Dictionary<string, double> PrivilegesChangedScope = new()
    {
        ["N"] = 0.85, ["L"] = 0.68, ["H"] = 0.50,
    };

    public static decimal? TryComputeBaseScore(string? vector)
    {
        if (string.IsNullOrWhiteSpace(vector)) return null;

        string[] segments = vector.Trim().Split('/', StringSplitOptions.RemoveEmptyEntries);

        if (segments.Length == 0) return null;

        bool isVersion4 = segments[0].StartsWith("CVSS:4.", StringComparison.OrdinalIgnoreCase);
        if (!isVersion4 && !segments[0].StartsWith("CVSS:3.", StringComparison.OrdinalIgnoreCase)) return null;

        Dictionary<string, string> metrics = new(StringComparer.OrdinalIgnoreCase);

        foreach (string segment in segments.Skip(1))
        {
            string[] pair = segment.Split(':');
            if (pair.Length == 2) metrics[pair[0]] = pair[1].ToUpperInvariant();
        }

        if (isVersion4) metrics = ToVersion3Metrics(metrics);

        if (!metrics.TryGetValue("S", out string? scope) || scope is not ("U" or "C")) return null;

        bool scopeChanged = scope == "C";

        if (!TryWeight(metrics, "AV", AttackVector, out double attackVector) ||
            !TryWeight(metrics, "AC", AttackComplexity, out double attackComplexity) ||
            !TryWeight(metrics, "UI", UserInteraction, out double userInteraction) ||
            !TryWeight(metrics, "C", Impact, out double confidentiality) ||
            !TryWeight(metrics, "I", Impact, out double integrity) ||
            !TryWeight(metrics, "A", Impact, out double availability) ||
            !TryWeight(metrics, "PR", scopeChanged ? PrivilegesChangedScope : PrivilegesUnchangedScope,
                out double privileges))
        {
            return null;
        }

        double impactSubScore = 1 - ((1 - confidentiality) * (1 - integrity) * (1 - availability));

        double impact = scopeChanged
            ? (7.52 * (impactSubScore - 0.029)) - (3.25 * Math.Pow(impactSubScore - 0.02, 15))
            : 6.42 * impactSubScore;

        if (impact <= 0) return 0m;

        double exploitability = 8.22 * attackVector * attackComplexity * privileges * userInteraction;

        double baseScore = scopeChanged
            ? Math.Min(1.08 * (impact + exploitability), 10)
            : Math.Min(impact + exploitability, 10);

        return RoundUp(baseScore);
    }

    private static Dictionary<string, string> ToVersion3Metrics(Dictionary<string, string> version4)
    {
        string Metric(string key) => version4.TryGetValue(key, out string? value) ? value : string.Empty;

        bool subsequentImpact = new[] { "SC", "SI", "SA" }.Any(key => Metric(key) == "H");

        string Impact(string vulnerableKey, string subsequentKey) =>
            subsequentImpact && ImpactRank(Metric(subsequentKey)) > ImpactRank(Metric(vulnerableKey))
                ? Metric(subsequentKey)
                : Metric(vulnerableKey);

        return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["AV"] = Metric("AV"),
            ["AC"] = Metric("AC") == "H" || Metric("AT") == "P" ? "H" : Metric("AC"),
            ["PR"] = Metric("PR"),
            ["UI"] = Metric("UI") is "P" or "A" ? "R" : Metric("UI"),
            ["S"] = subsequentImpact ? "C" : "U",
            ["C"] = Impact("VC", "SC"),
            ["I"] = Impact("VI", "SI"),
            ["A"] = Impact("VA", "SA"),
        };
    }

    private static int ImpactRank(string value) => value switch
    {
        "H" => 2,
        "L" => 1,
        _ => 0
    };

    private static bool TryWeight(Dictionary<string, string> metrics, string key,
        Dictionary<string, double> weights, out double weight)
    {
        weight = 0;

        return metrics.TryGetValue(key, out string? value) && weights.TryGetValue(value, out weight);
    }

    private static decimal RoundUp(double value)
    {
        int scaled = (int)Math.Round(value * 100000, MidpointRounding.AwayFromZero);

        return scaled % 10000 == 0
            ? scaled / 100000m
            : (Math.Floor(scaled / 10000m) + 1) / 10m;
    }
}
