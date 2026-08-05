namespace Sentinel.Domain.Versioning;

public class VersionComparer : IComparer<string>
{
    public static readonly VersionComparer Instance = new();

    public int Compare(string? x, string? y)
    {
        (int[] leftCore, string leftPrerelease) = Split(x);
        (int[] rightCore, string rightPrerelease) = Split(y);

        for (int i = 0; i < Math.Max(leftCore.Length, rightCore.Length); i++)
        {
            int leftPart = i < leftCore.Length ? leftCore[i] : 0;
            int rightPart = i < rightCore.Length ? rightCore[i] : 0;

            int comparison = leftPart.CompareTo(rightPart);
            if (comparison != 0) return comparison;
        }

        return ComparePrerelease(leftPrerelease, rightPrerelease);
    }

    private static (int[] Core, string Prerelease) Split(string? version)
    {
        string text = (version ?? string.Empty).Trim();

        if (text.StartsWith('v') || text.StartsWith('V')) text = text[1..];

        int buildSeparator = text.IndexOf('+');
        if (buildSeparator >= 0) text = text[..buildSeparator];

        int prereleaseSeparator = text.IndexOf('-');

        string core = prereleaseSeparator >= 0 ? text[..prereleaseSeparator] : text;
        string prerelease = prereleaseSeparator >= 0 ? text[(prereleaseSeparator + 1)..] : string.Empty;

        int[] parts = core
            .Split('.')
            .Select(part => int.TryParse(part, out int value) && value >= 0 ? value : 0)
            .ToArray();

        return (parts, prerelease);
    }

    private static int ComparePrerelease(string left, string right)
    {
        if (left.Length == 0 && right.Length == 0) return 0;
        if (left.Length == 0) return 1;
        if (right.Length == 0) return -1;

        string[] leftIdentifiers = left.Split('.');
        string[] rightIdentifiers = right.Split('.');

        for (int i = 0; i < Math.Min(leftIdentifiers.Length, rightIdentifiers.Length); i++)
        {
            int comparison = CompareIdentifier(leftIdentifiers[i], rightIdentifiers[i]);
            if (comparison != 0) return comparison;
        }

        return leftIdentifiers.Length.CompareTo(rightIdentifiers.Length);
    }

    private static int CompareIdentifier(string left, string right)
    {
        bool leftIsNumeric = int.TryParse(left, out int leftValue);
        bool rightIsNumeric = int.TryParse(right, out int rightValue);

        if (leftIsNumeric && rightIsNumeric) return leftValue.CompareTo(rightValue);
        if (leftIsNumeric) return -1;
        if (rightIsNumeric) return 1;

        return string.CompareOrdinal(left, right);
    }
}
