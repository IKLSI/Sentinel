namespace Sentinel.Domain.Versioning;

public class VersionComparer : IComparer<string>
{
    public static readonly VersionComparer Instance = new();

    public int Compare(string? x, string? y)
    {
        int[] left = ParseParts(x);
        int[] right = ParseParts(y);

        for (int i = 0; i < Math.Max(left.Length, right.Length); i++)
        {
            int leftPart = i < left.Length ? left[i] : 0;
            int rightPart = i < right.Length ? right[i] : 0;

            int comparison = leftPart.CompareTo(rightPart);
            if (comparison != 0) return comparison;
        }

        return string.CompareOrdinal(x, y);
    }

    private static int[] ParseParts(string? version) =>
        (version ?? string.Empty)
            .Split('.')
            .Select(part => int.TryParse(part, out int value) ? value : 0)
            .ToArray();
}
