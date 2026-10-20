using System.Text.RegularExpressions;

namespace Sentinel.Domain.Versioning;

public static partial class VersionText
{
    public static string Clean(string version)
        => PrefixRegex().Replace(version.Trim(), "").Split([' ', ','])[0].Trim();

    public static bool IsExact(string specification)
        => ExactRegex().IsMatch(specification.Trim());

    public static bool StartsWithDigit(string version)
        => version.Length > 0 && char.IsDigit(version[0]);

    [GeneratedRegex(@"^[\^~>=<\s=]+")]
    private static partial Regex PrefixRegex();

    [GeneratedRegex(@"^(?:={1,3}\s*|v)?\d+(?:\.\d+)*(?:[-+][0-9A-Za-z.\-+]*)?$")]
    private static partial Regex ExactRegex();
}
