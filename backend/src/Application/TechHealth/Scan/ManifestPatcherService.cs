using System.Text.Json;
using System.Text.RegularExpressions;
using System.Xml.Linq;

namespace Sentinel.Application.TechHealth.Scan;

public class ManifestPatcherService
{
    private const RegexOptions LineOptions = RegexOptions.Multiline | RegexOptions.IgnoreCase;
    private const RegexOptions BlockOptions = RegexOptions.Singleline | RegexOptions.IgnoreCase;
    private static readonly TimeSpan MatchTimeout = TimeSpan.FromSeconds(2);

    public static bool IsPatchable(string fileName)
    {
        string lower = fileName.ToLowerInvariant();
        return lower is "package.json" or "composer.json" or "pom.xml" or "requirements.txt"
            or "pyproject.toml" or "pipfile" or "go.mod" or "build.gradle" or "build.gradle.kts"
            or "libs.versions.toml" or "gemfile" or "cargo.toml" or "mix.exs" or "pubspec.yaml"
            or "package.swift" or "directory.packages.props" or "packages.config"
            || lower.EndsWith(".csproj");
    }

    public bool TryPatch(string fileName, string content, string dependencyName, string newVersion, out string patched)
    {
        patched = content;

        if (string.IsNullOrWhiteSpace(content) || string.IsNullOrWhiteSpace(dependencyName) || string.IsNullOrWhiteSpace(newVersion))
            return false;

        string lower = fileName.ToLowerInvariant();
        string name = Regex.Escape(dependencyName);

        if (lower == "package.json")
            return TryPatchNpm(content, dependencyName, newVersion, out patched);

        if (lower == "composer.json")
            return TryReplace(content, JsonPattern(name), newVersion, out patched);

        if (lower.EndsWith(".csproj"))
            return TryCsproj(content, name, newVersion, out patched);

        if (lower == "directory.packages.props")
            return TryPackageVersion(content, name, newVersion, out patched);

        if (lower == "packages.config")
            return TryReplace(content, PackagesConfigPattern(name), newVersion, out patched);

        if (lower == "pom.xml")
            return TryPom(content, dependencyName, newVersion, out patched);

        if (lower == "requirements.txt")
            return TryReplace(content, RequirementsPattern(name), newVersion, out patched);

        if (lower == "pyproject.toml")
            return TryPyproject(content, name, newVersion, out patched);

        if (lower == "pipfile")
            return TryToml(content, name, newVersion, out patched);

        if (lower == "go.mod")
            return TryReplace(content, GoPattern(name), newVersion, out patched);

        if (lower == "gemfile")
            return TryReplace(content, GemfilePattern(name), newVersion, out patched);

        if (lower == "cargo.toml")
            return TryToml(content, name, newVersion, out patched);

        if (lower == "mix.exs")
            return TryReplace(content, MixPattern(name), newVersion, out patched);

        if (lower == "pubspec.yaml")
            return TryReplace(content, PubspecPattern(name), newVersion, out patched);

        if (lower == "package.swift")
            return TryReplace(content, SwiftPattern(name), newVersion, BlockOptions, out patched);

        if (lower == "libs.versions.toml")
            return TryGradleCatalog(content, dependencyName, newVersion, out patched);

        if (lower is "build.gradle" or "build.gradle.kts")
            return TryReplace(content, GradlePattern(name), newVersion, out patched);

        return false;
    }

    private const string StructuralDelimiters = "{}[]()\"'";

    public static bool IsStructurallyValid(string fileName, string original, string patched)
    {
        string lower = fileName.ToLowerInvariant();

        try
        {
            if (lower is "package.json" or "composer.json")
            {
                using JsonDocument _ = JsonDocument.Parse(patched);
                return true;
            }

            if (lower is "pom.xml" or "packages.config" or "directory.packages.props" || lower.EndsWith(".csproj"))
            {
                XDocument.Parse(patched);
                return true;
            }

            return PreservesDelimiters(original, patched);
        }
        catch
        {
            return false;
        }
    }

    private static bool PreservesDelimiters(string original, string patched)
    {
        foreach (char delimiter in StructuralDelimiters)
        {
            if (Count(original, delimiter) != Count(patched, delimiter))
                return false;
        }

        return true;
    }

    private static int Count(string value, char target)
    {
        int count = 0;
        foreach (char c in value)
        {
            if (c == target) count++;
        }
        return count;
    }

    private static readonly string[] NpmDependencySections =
        { "dependencies", "devDependencies", "optionalDependencies", "peerDependencies" };

    private static bool TryPatchNpm(string content, string dependencyName, string newVersion, out string patched)
    {
        patched = content;
        string name = Regex.Escape(dependencyName);

        if (IsDeclaredInDependencies(content, name, out int open, out int close))
        {
            string block = content.Substring(open, close - open + 1);
            if (TryReplace(block, JsonPattern(name), newVersion, out string patchedBlock))
            {
                patched = content[..open] + patchedBlock + content[(close + 1)..];
                return true;
            }
            return false;
        }

        return TryPatchNpmOverrides(content, dependencyName, newVersion, out patched);
    }

    private static bool IsDeclaredInDependencies(string content, string name, out int open, out int close)
    {
        open = -1;
        close = -1;

        foreach (string section in NpmDependencySections)
        {
            Match sectionMatch = Regex.Match(content, $"\"{section}\"\\s*:\\s*\\{{");
            if (!sectionMatch.Success) continue;

            int sectionOpen = content.IndexOf('{', sectionMatch.Index);
            int sectionClose = FindMatchingBrace(content, sectionOpen);
            if (sectionClose < 0) continue;

            string block = content.Substring(sectionOpen, sectionClose - sectionOpen + 1);
            if (Regex.IsMatch(block, $"\"{name}\"\\s*:"))
            {
                open = sectionOpen;
                close = sectionClose;
                return true;
            }
        }

        return false;
    }

    private static bool TryPatchNpmOverrides(string content, string dependencyName, string newVersion, out string patched)
    {
        patched = content;
        string name = Regex.Escape(dependencyName);
        Match overridesMatch = Regex.Match(content, "\"overrides\"\\s*:\\s*\\{");

        if (overridesMatch.Success)
        {
            int open = content.IndexOf('{', overridesMatch.Index);
            int close = FindMatchingBrace(content, open);
            if (close < 0) return false;

            string block = content.Substring(open, close - open + 1);
            string entryPattern = $"(?<head>\"{name}\"\\s*:\\s*\")(?<ver>[^\"]*)(?<tail>\")";
            Match existing = Regex.Match(block, entryPattern);

            if (existing.Success)
            {
                if (existing.Groups["ver"].Value == newVersion) return false;
                string newBlock = block[..existing.Index]
                    + existing.Groups["head"].Value + newVersion + existing.Groups["tail"].Value
                    + block[(existing.Index + existing.Length)..];
                patched = content[..open] + newBlock + content[(close + 1)..];
                return true;
            }

            bool emptyOverrides = content[(open + 1)..close].Trim().Length == 0;
            patched = emptyOverrides
                ? content[..(open + 1)] + $"\n    \"{dependencyName}\": \"{newVersion}\"\n  " + content[close..]
                : content[..(open + 1)] + $"\n    \"{dependencyName}\": \"{newVersion}\"," + content[(open + 1)..];
            return true;
        }

        int rootOpen = content.IndexOf('{');
        if (rootOpen < 0) return false;

        int rootClose = FindMatchingBrace(content, rootOpen);
        bool emptyRoot = rootClose > rootOpen && content[(rootOpen + 1)..rootClose].Trim().Length == 0;

        patched = emptyRoot
            ? content[..(rootOpen + 1)] + $"\n  \"overrides\": {{\n    \"{dependencyName}\": \"{newVersion}\"\n  }}\n" + content[rootClose..]
            : content[..(rootOpen + 1)] + $"\n  \"overrides\": {{\n    \"{dependencyName}\": \"{newVersion}\"\n  }}," + content[(rootOpen + 1)..];
        return true;
    }

    private static int FindMatchingBrace(string content, int openIndex)
    {
        int depth = 0;
        bool inString = false;

        for (int i = openIndex; i < content.Length; i++)
        {
            char c = content[i];

            if (inString)
            {
                if (c == '\\') { i++; continue; }
                if (c == '"') inString = false;
            }
            else if (c == '"') inString = true;
            else if (c == '{') depth++;
            else if (c == '}')
            {
                depth--;
                if (depth == 0) return i;
            }
        }

        return -1;
    }

    private static bool TryCsproj(string content, string name, string newVersion, out string patched)
    {
        if (TryReplace(content, CsprojAttributePattern(name), newVersion, out patched)) return true;
        return TryReplace(content, CsprojElementPattern(name), newVersion, out patched);
    }

    private static bool TryPackageVersion(string content, string name, string newVersion, out string patched)
    {
        if (TryReplace(content, PackageVersionAttributePattern(name), newVersion, out patched)) return true;
        return TryReplace(content, PackageVersionElementPattern(name), newVersion, out patched);
    }

    private static bool TryToml(string content, string name, string newVersion, out string patched)
    {
        if (TryReplace(content, TomlInlinePattern(name), newVersion, out patched)) return true;
        return TryReplace(content, TomlTablePattern(name), newVersion, out patched);
    }

    private static bool TryPyproject(string content, string name, string newVersion, out string patched)
    {
        if (TryToml(content, name, newVersion, out patched)) return true;
        return TryReplace(content, Pep621Pattern(name), newVersion, out patched);
    }

    private static bool TryPom(string content, string dependencyName, string newVersion, out string patched)
    {
        patched = content;
        string[] parts = dependencyName.Split(':');
        if (parts.Length < 2) return false;

        string group = Regex.Escape(parts[0]);
        string artifact = Regex.Escape(parts[1]);

        if (TryReplace(content, PomPattern(group, artifact), newVersion, BlockOptions, out patched))
            return true;

        return TryPomProperty(content, group, artifact, newVersion, out patched);
    }

    private static bool TryPomProperty(string content, string group, string artifact, string newVersion, out string patched)
    {
        patched = content;
        string blockPattern =
            "<dependency>\\s*(?:<groupId>" + group + "</groupId>\\s*<artifactId>" + artifact + "</artifactId>"
            + "|<artifactId>" + artifact + "</artifactId>\\s*<groupId>" + group + "</groupId>)"
            + "\\s*<version>\\$\\{(?<prop>[^}]+)\\}</version>";

        Match match;
        try { match = Regex.Match(content, blockPattern, BlockOptions, MatchTimeout); }
        catch (RegexMatchTimeoutException) { return false; }

        if (!match.Success) return false;

        string prop = Regex.Escape(match.Groups["prop"].Value);
        string propertyPattern = $"(?<head><{prop}>)(?<ver>[^<]*)(?<tail></{prop}>)";
        return TryReplace(content, propertyPattern, newVersion, BlockOptions, out patched);
    }

    private static bool TryGradleCatalog(string content, string dependencyName, string newVersion, out string patched)
    {
        patched = content;
        string[] parts = dependencyName.Split(':');

        string coordinate = parts.Length >= 2
            ? $"(?:module\\s*=\\s*\"{Regex.Escape(dependencyName)}\"|group\\s*=\\s*\"{Regex.Escape(parts[0])}\"\\s*,\\s*name\\s*=\\s*\"{Regex.Escape(parts[1])}\")"
            : $"module\\s*=\\s*\"{Regex.Escape(dependencyName)}\"";

        string inlinePattern = $"(?<head>{coordinate}[^}}]*?version\\s*=\\s*\"[\\^~>=< ]*)(?<ver>\\d[\\w.\\-+]*)(?<tail>\")";
        if (TryReplace(content, inlinePattern, newVersion, RegexOptions.IgnoreCase, out patched))
            return true;

        string refPattern = $"{coordinate}[^}}]*?version\\.ref\\s*=\\s*\"(?<ref>[^\"]+)\"";
        Match refMatch;
        try { refMatch = Regex.Match(content, refPattern, RegexOptions.IgnoreCase, MatchTimeout); }
        catch (RegexMatchTimeoutException) { return false; }

        if (!refMatch.Success) return false;

        string key = Regex.Escape(refMatch.Groups["ref"].Value);
        string versionsPattern = $"(?<head>^\\s*{key}\\s*=\\s*\"[\\^~>=< ]*)(?<ver>\\d[\\w.\\-+]*)(?<tail>\")";
        return TryReplace(content, versionsPattern, newVersion, out patched);
    }

    private static bool TryReplace(string content, string pattern, string newVersion, out string patched)
        => TryReplace(content, pattern, newVersion, LineOptions, out patched);

    private static bool TryReplace(string content, string pattern, string newVersion, RegexOptions options, out string patched)
    {
        bool changed = false;

        try
        {
            patched = Regex.Replace(content, pattern, match =>
            {
                string currentVersion = match.Groups["ver"].Value;
                if (currentVersion == newVersion) return match.Value;

                changed = true;
                return match.Groups["head"].Value + newVersion + match.Groups["tail"].Value;
            }, options, MatchTimeout);
        }
        catch (RegexMatchTimeoutException)
        {
            patched = content;
            return false;
        }

        return changed;
    }

    private static string JsonPattern(string name)
        => $"(?<head>\"{name}\"\\s*:\\s*\"[\\^~>=<v ]*)(?<ver>\\d[\\w.\\-+]*)(?<tail>\\s*\")";

    private static string CsprojAttributePattern(string name)
        => $"(?<head><PackageReference\\s+Include=\"{name}\"[^>]*?Version=\")(?<ver>[^\"]*)(?<tail>\")";

    private static string CsprojElementPattern(string name)
        => $"(?<head><PackageReference\\s+Include=\"{name}\"[^>]*>\\s*<Version>)(?<ver>[^<]*)(?<tail></Version>)";

    private static string PackageVersionAttributePattern(string name)
        => $"(?<head><PackageVersion\\s+Include=\"{name}\"[^>]*?Version=\")(?<ver>[^\"]*)(?<tail>\")";

    private static string PackageVersionElementPattern(string name)
        => $"(?<head><PackageVersion\\s+Include=\"{name}\"[^>]*>\\s*<Version>)(?<ver>[^<]*)(?<tail></Version>)";

    private static string PackagesConfigPattern(string name)
        => $"(?<head><package\\s+id=\"{name}\"[^>]*?version=\")(?<ver>[^\"]*)(?<tail>\")";

    private static string PomPattern(string group, string artifact)
        => "(?<head><dependency>\\s*(?:<groupId>" + group + "</groupId>\\s*<artifactId>" + artifact + "</artifactId>"
           + "|<artifactId>" + artifact + "</artifactId>\\s*<groupId>" + group + "</groupId>)\\s*<version>)"
           + "(?<ver>\\d[^<]*)(?<tail></version>)";

    private static string RequirementsPattern(string name)
        => $"(?<head>^\\s*{name}\\s*(?:==|>=|~=|<=|>))(?<ver>\\s*\\d[\\w.\\-]*)(?<tail>)";

    private static string Pep621Pattern(string name)
        => $"(?<head>\"{name}\\s*(?:==|>=|~=|<=|>|<|!=|\\^)?\\s*[\\^~>=< ]*)(?<ver>\\d[\\w.\\-]*)(?<tail>)";

    private static string GoPattern(string name)
        => $"(?<head>{name}\\s+v)(?<ver>\\d[\\w.\\-+]*)(?<tail>)";

    private static string GemfilePattern(string name)
        => $"(?<head>gem\\s+['\"]{name}['\"]\\s*,\\s*['\"][~>=< ]*)(?<ver>\\d[\\w.\\-]*)(?<tail>)";

    private static string TomlInlinePattern(string name)
        => $"(?<head>^\\s*{name}\\s*=\\s*\\{{[^}}]*version\\s*=\\s*\"[\\^~>=< ]*)(?<ver>\\d[\\w.\\-]*)(?<tail>)";

    private static string TomlTablePattern(string name)
        => $"(?<head>^\\s*{name}\\s*=\\s*\"[\\^~>=< ]*)(?<ver>\\d[\\w.\\-]*)(?<tail>)";

    private static string MixPattern(string name)
        => $"(?<head>\\{{:{name}\\s*,\\s*\"[~>=< ]*)(?<ver>\\d[\\w.\\-]*)(?<tail>)";

    private static string PubspecPattern(string name)
        => $"(?<head>^\\s*{name}\\s*:\\s*['\"]?[\\^~>=< ]*)(?<ver>\\d[\\w.\\-+]*)(?<tail>)";

    private static string GradlePattern(string name)
        => $"(?<head>['\"]{name}:)(?<ver>\\d[^'\"]*)(?<tail>['\"])";

    private static string SwiftPattern(string name)
        => $"(?<head>\\.package\\([^)]*?{name}[\\s\\S]*?(?:from:|exact:)\\s*\")(?<ver>\\d[\\w.\\-+]*)(?<tail>\")";
}
