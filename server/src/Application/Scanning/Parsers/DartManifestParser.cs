using System.Text.RegularExpressions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Versioning;
using static Sentinel.Application.Scanning.Parsers.ManifestEntries;

namespace Sentinel.Application.Scanning.Parsers;

internal sealed partial class DartManifestParser : IManifestFileParser
{
    private const string PubspecYaml = "pubspec.yaml";
    private const string PubspecLock = "pubspec.lock";

    private static readonly HashSet<string> FileNames = FileNameSet(PubspecYaml, PubspecLock);

    public bool CanParse(string fileName) => FileNames.Contains(fileName);

    public void Parse(ManifestDocument manifest, ManifestParseResult result)
    {
        if (manifest.Is(PubspecYaml)) ParsePubspecYaml(manifest, result);
        else ParsePubspecLock(manifest, result);
    }

    private static void ParsePubspecYaml(ManifestDocument manifest, ManifestParseResult result)
    {
        AddSdkRuntimes(manifest.ProjectId, manifest.Content, result.Runtimes);

        DependencyType? sectionType = null;
        foreach (string raw in manifest.Content.Split('\n'))
        {
            string line = raw.TrimEnd();
            if (line.Length == 0) continue;

            if (!line.StartsWith(' '))
            {
                sectionType = SectionType(line);
                continue;
            }

            if (sectionType is not { } type) continue;

            Match entry = EntryRegex().Match(line);
            if (!entry.Success) continue;

            string rest = entry.Groups[2].Value.Trim();
            if (rest.Length == 0) continue;

            string specification = rest.Trim('"', '\'');
            string version = VersionText.Clean(specification);
            if (version.Length == 0 || !char.IsDigit(version[0])) continue;

            result.Dependencies.Add(new Dependency
            {
                ProjectId = manifest.ProjectId,
                Name = entry.Groups[1].Value,
                CurrentVersion = version,
                IsVersionPinned = VersionText.IsExact(specification),
                Type = type,
                Ecosystem = DependencyEcosystem.Pub,
            });
        }
    }

    private static DependencyType? SectionType(string line)
    {
        if (line.StartsWith("dependencies:")) return DependencyType.Prod;
        if (line.StartsWith("dev_dependencies:")) return DependencyType.Dev;

        return null;
    }

    private static void AddSdkRuntimes(Guid projectId, string content, List<Runtime> runtimes)
    {
        Match environmentBlock = EnvironmentRegex().Match(content);
        if (!environmentBlock.Success) return;

        string environment = environmentBlock.Groups[1].Value;

        AddSdkRuntime(projectId, "Dart", DartSdkRegex().Match(environment), runtimes);
        AddSdkRuntime(projectId, "Flutter", FlutterSdkRegex().Match(environment), runtimes);
    }

    private static void AddSdkRuntime(Guid projectId, string name, Match sdkConstraint, List<Runtime> runtimes)
    {
        if (!sdkConstraint.Success) return;

        bool hasRangeOperator = sdkConstraint.Groups[1].Value.Trim().Length > 0;
        runtimes.Add(NewRuntime(projectId, name, sdkConstraint.Groups[2].Value, hasRangeOperator));
    }

    private static void ParsePubspecLock(ManifestDocument manifest, ManifestParseResult result)
    {
        bool inPackages = false;
        string? name = null, version = null, dependency = null, source = null;

        void Flush()
        {
            if (name != null && !string.IsNullOrEmpty(version) && (source == null || source == "hosted"))
            {
                bool isDev = dependency != null && dependency.Contains("dev");
                result.Dependencies.Add(new Dependency
                {
                    ProjectId = manifest.ProjectId,
                    Name = name,
                    CurrentVersion = version,
                    IsDirect = dependency == null || dependency.StartsWith("direct", StringComparison.Ordinal),
                    Type = isDev ? DependencyType.Dev : DependencyType.Prod,
                    Ecosystem = DependencyEcosystem.Pub,
                });
            }
            name = version = dependency = source = null;
        }

        foreach (string raw in manifest.Content.Split('\n'))
        {
            string line = raw.TrimEnd();
            if (line.Length == 0) continue;

            if (!line.StartsWith(' '))
            {
                Flush();
                inPackages = line.StartsWith("packages:");
                continue;
            }

            if (!inPackages) continue;

            Match packageStart = LockPackageRegex().Match(line);
            if (packageStart.Success)
            {
                Flush();
                name = packageStart.Groups[1].Value;
                continue;
            }

            Match property = LockPropertyRegex().Match(line);
            if (!property.Success) continue;

            switch (property.Groups[1].Value)
            {
                case "version": version = property.Groups[2].Value; break;
                case "dependency": dependency = property.Groups[2].Value; break;
                case "source": source = property.Groups[2].Value; break;
            }
        }
        Flush();
    }

    [GeneratedRegex(@"^environment:\s*\n((?:[ \t]+.*\n?)*)", RegexOptions.Multiline)]
    private static partial Regex EnvironmentRegex();

    [GeneratedRegex(@"sdk:\s*[""']?([\^~>=<\s]*)(\d[\d.]*)")]
    private static partial Regex DartSdkRegex();

    [GeneratedRegex(@"flutter:\s*[""']?([\^~>=<\s]*)(\d[\d.]*)")]
    private static partial Regex FlutterSdkRegex();

    [GeneratedRegex(@"^  ([a-zA-Z0-9_]+):\s*(.*)$")]
    private static partial Regex EntryRegex();

    [GeneratedRegex(@"^  (\S[^:]*):\s*$")]
    private static partial Regex LockPackageRegex();

    [GeneratedRegex(@"^    (version|dependency|source):\s*[""']?([^""'\n]+?)[""']?\s*$")]
    private static partial Regex LockPropertyRegex();
}
