namespace Sentinel.Application.TechHealth.Scan;

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
        (int[] coreA, string prereleaseA) = Split(a);
        (int[] coreB, string prereleaseB) = Split(b);

        int length = Math.Max(coreA.Length, coreB.Length);
        for (int i = 0; i < length; i++)
        {
            int x = i < coreA.Length ? coreA[i] : 0;
            int y = i < coreB.Length ? coreB[i] : 0;
            if (x != y) return x.CompareTo(y);
        }

        return ComparePrerelease(prereleaseA, prereleaseB);
    }

    private static int ComparePrerelease(string a, string b)
    {
        if (a == b) return 0;
        if (a.Length == 0) return 1;
        if (b.Length == 0) return -1;

        string[] partsA = a.Split('.');
        string[] partsB = b.Split('.');
        int length = Math.Min(partsA.Length, partsB.Length);

        for (int i = 0; i < length; i++)
        {
            bool numericA = int.TryParse(partsA[i], out int valueA);
            bool numericB = int.TryParse(partsB[i], out int valueB);

            if (numericA && numericB)
            {
                if (valueA != valueB) return valueA.CompareTo(valueB);
            }
            else if (numericA) return -1;
            else if (numericB) return 1;
            else
            {
                int comparison = string.CompareOrdinal(partsA[i], partsB[i]);
                if (comparison != 0) return comparison;
            }
        }

        return partsA.Length.CompareTo(partsB.Length);
    }

    private static (int[] Core, string Prerelease) Split(string version)
    {
        string trimmed = version.Split('+')[0].TrimStart('v', 'V', '^', '~', '=', '>', '<', ' ');

        string prerelease = "";
        int dash = trimmed.IndexOf('-');
        if (dash >= 0)
        {
            prerelease = trimmed[(dash + 1)..];
            trimmed = trimmed[..dash];
        }

        int[] core = trimmed.Split('.')
            .Select(p => int.TryParse(p, out int n) ? n : 0)
            .ToArray();

        return (core, prerelease);
    }

    private static int Major(string version)
    {
        (int[] core, _) = Split(version);
        return core.Length > 0 ? core[0] : 0;
    }
}
