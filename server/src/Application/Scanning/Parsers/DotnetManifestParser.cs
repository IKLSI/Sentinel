using System.Text.Json;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Parsing;
using static Sentinel.Application.Scanning.Parsers.ManifestEntries;

namespace Sentinel.Application.Scanning.Parsers;

internal sealed partial class DotnetManifestParser : IManifestFileParser
{
    private const string DirectoryBuildProps = "Directory.Build.props";
    private const string DirectoryPackagesProps = "Directory.Packages.props";
    private const string NuGetLock = "packages.lock.json";
    private const string PackagesConfig = "packages.config";
    private const string DirectDependencyType = "Direct";

    private static readonly HashSet<string> FileNames =
        FileNameSet(DirectoryBuildProps, DirectoryPackagesProps, NuGetLock, PackagesConfig);

    public bool CanParse(string fileName) => FileNames.Contains(fileName) || ManifestFileKinds.IsProjectFile(fileName);

    public void Parse(ManifestDocument manifest, ManifestParseResult result)
    {
        if (manifest.Is(DirectoryPackagesProps)) ParseCentralPackageVersions(manifest, result);
        else if (manifest.Is(NuGetLock)) ParseNuGetLock(manifest, result);
        else if (manifest.Is(PackagesConfig)) ParsePackagesConfig(manifest, result);
        else ParseMsBuildProject(manifest, result);
    }

    private static void ParseMsBuildProject(ManifestDocument manifest, ManifestParseResult result)
    {
        XDocument doc = UntrustedXml.Parse(manifest.Content);

        IEnumerable<string> targetFrameworks = doc.Descendants("TargetFramework").Select(e => e.Value)
            .Concat(doc.Descendants("TargetFrameworks").SelectMany(e => e.Value.Split(';')));

        foreach (string targetFramework in targetFrameworks)
        {
            if (ParseTargetFramework(targetFramework) is not (string name, string version)) continue;

            result.Runtimes.Add(NewRuntime(manifest.ProjectId, name, version));
        }

        foreach (XElement pkgRef in doc.Descendants("PackageReference"))
        {
            string name = pkgRef.Attribute("Include")?.Value ?? "";
            string version = pkgRef.Attribute("VersionOverride")?.Value
                ?? pkgRef.Attribute("Version")?.Value
                ?? pkgRef.Element("Version")?.Value
                ?? "";
            if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(version) || version.Contains('$')) continue;

            result.Dependencies.Add(NewDependency(manifest.ProjectId, name, version, DependencyEcosystem.NuGet));
        }
    }

    private static (string Name, string Version)? ParseTargetFramework(string targetFramework)
    {
        string moniker = targetFramework.Trim().ToLowerInvariant();

        if (moniker.StartsWith("netstandard", StringComparison.Ordinal)) return null;

        Match modern = ModernTargetFrameworkRegex().Match(moniker);
        if (modern.Success) return (".NET", $"{modern.Groups[1].Value}.{modern.Groups[2].Value}");

        Match legacy = LegacyTargetFrameworkRegex().Match(moniker);
        if (!legacy.Success) return null;

        string version = legacy.Groups[3].Success
            ? $"{legacy.Groups[1].Value}.{legacy.Groups[2].Value}.{legacy.Groups[3].Value}"
            : $"{legacy.Groups[1].Value}.{legacy.Groups[2].Value}";

        return (".NET Framework", version);
    }

    private static void ParseCentralPackageVersions(ManifestDocument manifest, ManifestParseResult result)
    {
        XDocument doc = UntrustedXml.Parse(manifest.Content);

        foreach (XElement package in doc.Descendants().Where(e => e.Name.LocalName == "PackageVersion"))
        {
            string name = package.Attribute("Include")?.Value ?? "";
            string version = package.Attribute("Version")?.Value
                ?? package.Elements().FirstOrDefault(e => e.Name.LocalName == "Version")?.Value
                ?? "";

            if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(version) || version.StartsWith('$')) continue;

            result.Dependencies.Add(NewDependency(manifest.ProjectId, name, version, DependencyEcosystem.NuGet));
        }
    }

    private static void ParsePackagesConfig(ManifestDocument manifest, ManifestParseResult result)
    {
        XDocument doc = UntrustedXml.Parse(manifest.Content);

        foreach (XElement package in doc.Descendants().Where(e => e.Name.LocalName == "package"))
        {
            string name = package.Attribute("id")?.Value ?? "";
            string version = package.Attribute("version")?.Value ?? "";
            if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(version)) continue;

            bool isDevelopment = string.Equals(package.Attribute("developmentDependency")?.Value, "true",
                StringComparison.OrdinalIgnoreCase);

            result.Dependencies.Add(NewDependency(manifest.ProjectId, name, version,
                DependencyEcosystem.NuGet, isDevelopment ? DependencyType.Dev : DependencyType.Prod));
        }
    }

    private static void ParseNuGetLock(ManifestDocument manifest, ManifestParseResult result)
    {
        using JsonDocument doc = JsonDocument.Parse(manifest.Content);
        if (!doc.RootElement.TryGetProperty("dependencies", out JsonElement frameworks)) return;

        Dictionary<(string Name, string Version), Dependency> seen = new(new PackageIdentityComparer());

        foreach (JsonProperty framework in frameworks.EnumerateObject())
        {
            foreach (JsonProperty package in framework.Value.EnumerateObject())
                AddLockedPackage(manifest.ProjectId, package, seen, result.Dependencies);
        }
    }

    private static void AddLockedPackage(Guid projectId, JsonProperty package,
        Dictionary<(string Name, string Version), Dependency> seen, List<Dependency> deps)
    {
        string type = package.Value.StringProperty("type") ?? "";
        if (type.Equals("Project", StringComparison.OrdinalIgnoreCase)) return;

        string version = package.Value.StringProperty("resolved") ?? "";
        if (string.IsNullOrEmpty(version)) return;

        bool isDirect = type.Equals(DirectDependencyType, StringComparison.OrdinalIgnoreCase);

        if (seen.TryGetValue((package.Name, version), out Dependency? existing))
        {
            existing.IsDirect |= isDirect;
            return;
        }

        Dependency dependency = new Dependency
        {
            ProjectId = projectId,
            Name = package.Name,
            CurrentVersion = version,
            IsDirect = isDirect,
            Ecosystem = DependencyEcosystem.NuGet,
        };

        seen[(package.Name, version)] = dependency;
        deps.Add(dependency);
    }

    [GeneratedRegex(@"^net(?:coreapp)?(\d+)\.(\d+)")]
    private static partial Regex ModernTargetFrameworkRegex();

    [GeneratedRegex(@"^net(\d)(\d)(\d)?$")]
    private static partial Regex LegacyTargetFrameworkRegex();

    private sealed class PackageIdentityComparer : IEqualityComparer<(string Name, string Version)>
    {
        public bool Equals((string Name, string Version) x, (string Name, string Version) y) =>
            string.Equals(x.Name, y.Name, StringComparison.OrdinalIgnoreCase)
            && string.Equals(x.Version, y.Version, StringComparison.OrdinalIgnoreCase);

        public int GetHashCode((string Name, string Version) obj) =>
            HashCode.Combine(obj.Name.ToLowerInvariant(), obj.Version.ToLowerInvariant());
    }
}
