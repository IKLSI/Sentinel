namespace Sentinel.Application.Services;

public static class SafeVersionResolver
{
    public static string? Resolve(string currentVersion, IEnumerable<string?> fixedVersions)
    {
        List<string> candidates = fixedVersions
            .Where(f => !string.IsNullOrWhiteSpace(f))
            .Select(f => f!.Trim())
            .Distinct()
            .ToList();

        if (candidates.Count == 0) return null;

        string target = candidates[0];
        foreach (string candidate in candidates)
        {
            if (Compare(candidate, target) > 0) target = candidate;
        }

        if (Compare(target, currentVersion) <= 0) return null;

        return NormalizeOutput(target);
    }

    public static bool IsBreaking(string currentVersion, string targetVersion)
        => Major(targetVersion) > Major(currentVersion);

    private static string NormalizeOutput(string version)
        => version.Split('-', '+')[0].TrimStart('v', 'V', '^', '~', '=', '>', '<', ' ');

    private static int Compare(string a, string b)
    {
        int[] pa = Parse(a);
        int[] pb = Parse(b);
        int length = Math.Max(pa.Length, pb.Length);

        for (int i = 0; i < length; i++)
        {
            int x = i < pa.Length ? pa[i] : 0;
            int y = i < pb.Length ? pb[i] : 0;
            if (x != y) return x.CompareTo(y);
        }

        return 0;
    }

    private static int[] Parse(string version)
    {
        string core = version.Split('-', '+')[0].TrimStart('v', 'V', '^', '~', '=', '>', '<', ' ');
        return core.Split('.')
            .Select(p => int.TryParse(p, out int n) ? n : 0)
            .ToArray();
    }

    private static int Major(string version)
    {
        int[] parts = Parse(version);
        return parts.Length > 0 ? parts[0] : 0;
    }
}
