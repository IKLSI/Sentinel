using System.Text.RegularExpressions;

namespace Sentinel.Domain.Versioning;

public static partial class VersionText
{
    public static string Clean(string version)
        => PrefixRegex().Replace(version.Trim(), "").Split([' ', ','])[0].Trim();

    [GeneratedRegex(@"^[\^~>=<\s=]+")]
    private static partial Regex PrefixRegex();
}
