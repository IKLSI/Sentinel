using System.Text.RegularExpressions;

namespace Sentinel.Application.Deployments.Compare;

public static partial class ReleaseNotes
{
    private static readonly string[] MergePrefixes = ["Merge branch ", "Merge pull request ", "Merge remote-tracking ", "Merge tag "];

    private static readonly string[] FeatureMarkers = ["✨", "🎉", ":sparkles:", ":tada:"];

    private static readonly string[] FixMarkers =
        ["🐛", "🚑", "🩹", "🔒", ":bug:", ":ambulance:", ":adhesive_bandage:", ":lock:"];

    public static string TitleOf(string message)
    {
        int lineEnd = message.IndexOfAny(['\r', '\n']);
        return (lineEnd < 0 ? message : message[..lineEnd]).Trim();
    }

    public static bool IsMergeCommit(string title) =>
        MergePrefixes.Any(prefix => title.StartsWith(prefix, StringComparison.Ordinal));

    public static ReleaseCommitCategory CategoryOf(string title)
    {
        Match conventional = ConventionalPrefixPattern().Match(title);

        if (conventional.Success)
        {
            return conventional.Groups["type"].Value.ToLowerInvariant() switch
            {
                "feat" => ReleaseCommitCategory.Feature,
                "fix" or "security" => ReleaseCommitCategory.Fix,
                _ => ReleaseCommitCategory.Maintenance
            };
        }

        if (FeatureMarkers.Any(marker => title.StartsWith(marker, StringComparison.Ordinal)))
            return ReleaseCommitCategory.Feature;

        return FixMarkers.Any(marker => title.StartsWith(marker, StringComparison.Ordinal))
            ? ReleaseCommitCategory.Fix
            : ReleaseCommitCategory.Maintenance;
    }

    public static string NoteTitleOf(string title)
    {
        string withoutPrefix = ConventionalPrefixPattern().Replace(title, string.Empty);
        string cleaned = LeadingMarkerPattern().Replace(withoutPrefix, string.Empty).Trim();

        return cleaned.Length == 0 ? title : char.ToUpperInvariant(cleaned[0]) + cleaned[1..];
    }

    [GeneratedRegex(@"^(?<type>[a-zA-Z]+)(?:\([^)]*\))?!?:\s*", RegexOptions.None, 1000)]
    private static partial Regex ConventionalPrefixPattern();

    [GeneratedRegex(@"^(?:\s*(?::[a-z0-9_+-]+:|[^\p{L}\p{N}\s]+))+\s*", RegexOptions.None, 1000)]
    private static partial Regex LeadingMarkerPattern();
}
