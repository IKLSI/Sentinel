using System.Text.Json;
using System.Text.RegularExpressions;
using System.Xml;
using System.Xml.Linq;
using Sentinel.Domain.Entities;

namespace Sentinel.Application.TechHealth.Scan;

public partial class ManifestParserService
{
    private const string NuGetDirectDependencyType = "Direct";

    private static readonly XmlReaderSettings UntrustedXmlSettings = new()
    {
        DtdProcessing = DtdProcessing.Prohibit,
        XmlResolver = null,
    };

    private static XDocument ParseUntrustedXml(string content)
    {
        using XmlReader reader = XmlReader.Create(new StringReader(content), UntrustedXmlSettings);
        return XDocument.Load(reader);
    }

    private static void ParseCsproj(Guid projectId, string content, List<Dependency> deps, List<Runtime> runtimes)
    {
        XDocument doc = ParseUntrustedXml(content);

        IEnumerable<string> targetFrameworks = doc.Descendants("TargetFramework").Select(e => e.Value)
            .Concat(doc.Descendants("TargetFrameworks").SelectMany(e => e.Value.Split(';')));

        foreach (string targetFramework in targetFrameworks)
        {
            if (ParseTargetFramework(targetFramework) is not (string name, string version)) continue;

            runtimes.Add(new Runtime { ProjectId = projectId, Name = name, Version = version });
        }

        foreach (XElement pkgRef in doc.Descendants("PackageReference"))
        {
            string name = pkgRef.Attribute("Include")?.Value ?? "";
            string version = pkgRef.Attribute("VersionOverride")?.Value
                ?? pkgRef.Attribute("Version")?.Value
                ?? pkgRef.Element("Version")?.Value
                ?? "";
            if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(version) || version.Contains('$')) continue;

            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = name,
                CurrentVersion = version,
                Type = DependencyType.Prod,
                Ecosystem = DependencyEcosystem.NuGet,
                Status = DependencyStatus.UpToDate,
            });
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

    private static void ParsePomXml(Guid projectId, string content, List<Dependency> deps, List<Runtime> runtimes)
    {
        XDocument doc = ParseUntrustedXml(content);
        XNamespace ns = doc.Root?.Name.Namespace ?? XNamespace.None;

        Dictionary<string, string> properties = ReadMavenProperties(doc, ns);

        string? javaVersion = doc.Descendants(ns + "maven.compiler.release").FirstOrDefault()?.Value
                       ?? doc.Descendants(ns + "maven.compiler.source").FirstOrDefault()?.Value
                       ?? doc.Descendants(ns + "maven.compiler.target").FirstOrDefault()?.Value
                       ?? doc.Descendants(ns + "java.version").FirstOrDefault()?.Value;

        javaVersion = ResolveMavenVersion(javaVersion ?? string.Empty, properties);

        if (!string.IsNullOrEmpty(javaVersion))
            runtimes.Add(new Runtime { ProjectId = projectId, Name = "Java", Version = javaVersion });

        string? springBootVersion = ReadSpringBootParentVersion(doc, ns);
        if (!string.IsNullOrEmpty(springBootVersion))
            runtimes.Add(new Runtime { ProjectId = projectId, Name = "Spring Boot", Version = springBootVersion });

        foreach (XElement dep in doc.Descendants(ns + "dependency").Where(IsProjectDependency))
        {
            string groupId = dep.Element(ns + "groupId")?.Value ?? "";
            string artifactId = dep.Element(ns + "artifactId")?.Value ?? "";
            string version = ResolveMavenVersion(dep.Element(ns + "version")?.Value ?? "", properties);
            string scope = dep.Element(ns + "scope")?.Value ?? "compile";

            if (string.IsNullOrEmpty(artifactId) || string.IsNullOrEmpty(version) || version.StartsWith('$')) continue;

            string name = string.IsNullOrEmpty(groupId) ? artifactId : $"{groupId}:{artifactId}";
            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = name,
                CurrentVersion = version,
                Type = scope == "test" ? DependencyType.Dev : DependencyType.Prod,
                Ecosystem = DependencyEcosystem.Maven,
                Status = DependencyStatus.UpToDate,
            });
        }
    }

    private static bool IsProjectDependency(XElement dependency) =>
        !dependency.Ancestors().Any(ancestor => ancestor.Name.LocalName is "dependencyManagement" or "plugin");

    private static string? ReadSpringBootParentVersion(XDocument doc, XNamespace ns)
    {
        XElement? parent = doc.Descendants(ns + "parent")
            .FirstOrDefault(p => p.Element(ns + "artifactId")?.Value == "spring-boot-starter-parent");

        return parent?.Element(ns + "version")?.Value;
    }

    private static Dictionary<string, string> ReadMavenProperties(XDocument doc, XNamespace ns)
    {
        Dictionary<string, string> properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        foreach (XElement property in doc.Descendants(ns + "properties").Elements())
        {
            string value = property.Value.Trim();
            if (!string.IsNullOrEmpty(value)) properties.TryAdd(property.Name.LocalName, value);
        }

        return properties;
    }

    private static string ResolveMavenVersion(string version, Dictionary<string, string> properties)
    {
        string trimmed = version.Trim();

        Match reference = MavenPropertyReferenceRegex().Match(trimmed);
        if (!reference.Success) return trimmed;

        return properties.TryGetValue(reference.Groups[1].Value, out string? resolved) ? resolved : string.Empty;
    }

    private static void ParseDirectoryPackagesProps(Guid projectId, string content, List<Dependency> deps)
    {
        XDocument doc = ParseUntrustedXml(content);

        foreach (XElement package in doc.Descendants().Where(e => e.Name.LocalName == "PackageVersion"))
        {
            string name = package.Attribute("Include")?.Value ?? "";
            string version = package.Attribute("Version")?.Value
                ?? package.Elements().FirstOrDefault(e => e.Name.LocalName == "Version")?.Value
                ?? "";

            if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(version) || version.StartsWith('$')) continue;

            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = name,
                CurrentVersion = version,
                Type = DependencyType.Prod,
                Ecosystem = DependencyEcosystem.NuGet,
                Status = DependencyStatus.UpToDate,
            });
        }
    }

    private static void ParseVersionCatalog(Guid projectId, string content, List<Dependency> deps)
    {
        Dictionary<string, string> versions = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        List<(string Key, string Value)> libraries = new List<(string, string)>();
        string? section = null;

        foreach (string raw in content.Split('\n'))
        {
            string line = raw.Trim();
            if (line.Length == 0 || line.StartsWith('#')) continue;

            if (line.StartsWith('['))
            {
                section = line.Trim('[', ']').ToLowerInvariant();
                continue;
            }

            int equals = line.IndexOf('=');
            if (equals <= 0) continue;

            string key = line[..equals].Trim();
            string value = line[(equals + 1)..].Trim();

            if (section == "versions")
            {
                Match literal = QuotedLiteralPrefixRegex().Match(value);
                if (literal.Success) versions[key] = literal.Groups[1].Value;
                continue;
            }

            if (section == "libraries") libraries.Add((key, value));
        }

        foreach ((string _, string value) in libraries)
        {
            (string? name, string? version) = ResolveCatalogLibrary(value, versions);
            if (name == null || version == null) continue;

            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = name,
                CurrentVersion = version,
                Type = DependencyType.Prod,
                Ecosystem = DependencyEcosystem.Maven,
                Status = DependencyStatus.UpToDate,
            });
        }
    }

    private static (string? Name, string? Version) ResolveCatalogLibrary(string value,
        Dictionary<string, string> versions)
    {
        Match shorthand = VersionCatalogShorthandRegex().Match(value);
        if (shorthand.Success) return (shorthand.Groups[1].Value, shorthand.Groups[2].Value);

        string? module = null;

        Match moduleMatch = VersionCatalogModuleRegex().Match(value);
        if (moduleMatch.Success)
        {
            module = moduleMatch.Groups[1].Value;
        }
        else
        {
            Match group = VersionCatalogGroupRegex().Match(value);
            Match artifact = VersionCatalogNameRegex().Match(value);
            if (group.Success && artifact.Success) module = $"{group.Groups[1].Value}:{artifact.Groups[1].Value}";
        }

        if (module == null) return (null, null);

        Match versionReference = VersionCatalogVersionRefRegex().Match(value);
        if (versionReference.Success)
        {
            return versions.TryGetValue(versionReference.Groups[1].Value, out string? resolved)
                ? (module, resolved)
                : (null, null);
        }

        Match literalVersion = InlineTableVersionRegex().Match(value);

        return literalVersion.Success ? (module, literalVersion.Groups[1].Value) : (null, null);
    }

    private static void ParseBuildGradle(Guid projectId, string content, List<Dependency> deps, List<Runtime> runtimes)
    {
        string? javaVersion = ReadGradleJavaVersion(content);
        if (javaVersion != null)
            runtimes.Add(new Runtime { ProjectId = projectId, Name = "Java", Version = javaVersion });

        Match kotlinMatch = KotlinJvmPluginRegex().Match(content);
        if (!kotlinMatch.Success)
            kotlinMatch = KotlinJvmPluginIdRegex().Match(content);
        if (kotlinMatch.Success)
            runtimes.Add(new Runtime { ProjectId = projectId, Name = "Kotlin", Version = kotlinMatch.Groups[1].Value });

        Match springBootMatch = SpringBootPluginRegex().Match(content);
        if (springBootMatch.Success)
            runtimes.Add(new Runtime { ProjectId = projectId, Name = "Spring Boot", Version = springBootMatch.Groups[1].Value });

        foreach (Match m in CoordPatternRegex().Matches(content))
        {
            string coord = m.Groups[1].Value;
            string[] parts = coord.Split(':');
            if (parts.Length < 3) continue;

            string name = $"{parts[0]}:{parts[1]}";
            string version = parts[2];
            string config = m.Value.TrimStart();
            bool isTest = config.StartsWith("test", StringComparison.OrdinalIgnoreCase);

            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = name,
                CurrentVersion = version,
                Type = isTest ? DependencyType.Dev : DependencyType.Prod,
                Ecosystem = DependencyEcosystem.Maven,
                Status = DependencyStatus.UpToDate,
            });
        }

        foreach (Match m in NamedPatternRegex().Matches(content))
        {
            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = $"{m.Groups[1].Value}:{m.Groups[2].Value}",
                CurrentVersion = m.Groups[3].Value,
                Type = DependencyType.Prod,
                Ecosystem = DependencyEcosystem.Maven,
                Status = DependencyStatus.UpToDate,
            });
        }
    }

    private static string? ReadGradleJavaVersion(string content)
    {
        Match toolchain = JavaToolchainRegex().Match(content);
        if (toolchain.Success) return toolchain.Groups[1].Value;

        Match jvmToolchain = JvmToolchainRegex().Match(content);
        if (jvmToolchain.Success) return jvmToolchain.Groups[1].Value;

        Match javaVersionConstant = JavaVersionConstantRegex().Match(content);
        if (javaVersionConstant.Success)
        {
            return javaVersionConstant.Groups[2].Success
                ? javaVersionConstant.Groups[2].Value
                : javaVersionConstant.Groups[1].Value;
        }

        Match literal = JavaCompatibilityLiteralRegex().Match(content);

        return literal.Success ? literal.Groups[1].Value : null;
    }

    private static void ParseNuGetLockJson(Guid projectId, string content, List<Dependency> deps)
    {
        using JsonDocument doc = JsonDocument.Parse(content);
        if (!doc.RootElement.TryGetProperty("dependencies", out JsonElement frameworks)) return;

        HashSet<string> seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (JsonProperty framework in frameworks.EnumerateObject())
        {
            foreach (JsonProperty pkg in framework.Value.EnumerateObject())
            {
                string type = pkg.Value.TryGetProperty("type", out JsonElement t) ? t.GetString() ?? "" : "";
                if (type.Equals("Project", StringComparison.OrdinalIgnoreCase)) continue;

                string version = pkg.Value.TryGetProperty("resolved", out JsonElement r) ? r.GetString() ?? "" : "";
                if (string.IsNullOrEmpty(version) || !seen.Add(pkg.Name)) continue;

                deps.Add(new Dependency
                {
                    ProjectId = projectId,
                    Name = pkg.Name,
                    CurrentVersion = version,
                    Type = DependencyType.Prod,
                    IsDirect = type.Equals(NuGetDirectDependencyType, StringComparison.OrdinalIgnoreCase),
                    Ecosystem = DependencyEcosystem.NuGet,
                    Status = DependencyStatus.UpToDate,
                });
            }
        }
    }

    private static void ParseGradleLockfile(Guid projectId, string content, List<Dependency> deps)
    {
        foreach (string raw in content.Split('\n'))
        {
            string line = raw.Trim();
            if (line.StartsWith('#') || string.IsNullOrEmpty(line)) continue;

            int eq = line.IndexOf('=');
            if (eq <= 0) continue;

            string coord = line[..eq];
            string configs = line[(eq + 1)..];
            string[] parts = coord.Split(':');
            if (parts.Length < 3) continue;

            bool isTest = configs.Contains("test", StringComparison.OrdinalIgnoreCase);

            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = $"{parts[0]}:{parts[1]}",
                CurrentVersion = parts[2],
                Type = isTest ? DependencyType.Dev : DependencyType.Prod,
                Ecosystem = DependencyEcosystem.Maven,
                Status = DependencyStatus.UpToDate,
            });
        }
    }

    private static void ParsePackagesConfig(Guid projectId, string content, List<Dependency> deps)
    {
        XDocument doc = ParseUntrustedXml(content);

        foreach (XElement package in doc.Descendants().Where(e => e.Name.LocalName == "package"))
        {
            string name = package.Attribute("id")?.Value ?? "";
            string version = package.Attribute("version")?.Value ?? "";
            if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(version)) continue;

            bool isDevelopment = string.Equals(package.Attribute("developmentDependency")?.Value, "true",
                StringComparison.OrdinalIgnoreCase);

            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = name,
                CurrentVersion = version,
                Type = isDevelopment ? DependencyType.Dev : DependencyType.Prod,
                Ecosystem = DependencyEcosystem.NuGet,
                Status = DependencyStatus.UpToDate,
            });
        }
    }

    [GeneratedRegex(@"^net(?:coreapp)?(\d+)\.(\d+)")]
    private static partial Regex ModernTargetFrameworkRegex();

    [GeneratedRegex(@"^net(\d)(\d)(\d)?$")]
    private static partial Regex LegacyTargetFrameworkRegex();

    [GeneratedRegex(@"^\$\{([^}]+)\}$")]
    private static partial Regex MavenPropertyReferenceRegex();

    [GeneratedRegex(@"^[""']([^""']+)[""']")]
    private static partial Regex QuotedLiteralPrefixRegex();

    [GeneratedRegex(@"^[""']([a-zA-Z0-9.\-_]+:[a-zA-Z0-9.\-_]+):([^""']+)[""']$")]
    private static partial Regex VersionCatalogShorthandRegex();

    [GeneratedRegex(@"module\s*=\s*[""']([^""']+)[""']")]
    private static partial Regex VersionCatalogModuleRegex();

    [GeneratedRegex(@"group\s*=\s*[""']([^""']+)[""']")]
    private static partial Regex VersionCatalogGroupRegex();

    [GeneratedRegex(@"name\s*=\s*[""']([^""']+)[""']")]
    private static partial Regex VersionCatalogNameRegex();

    [GeneratedRegex(@"version\.ref\s*=\s*[""']([^""']+)[""']")]
    private static partial Regex VersionCatalogVersionRefRegex();

    [GeneratedRegex(@"kotlin\(['""]jvm['""]\)\s+version\s+['""]([^'""]+)['""]")]
    private static partial Regex KotlinJvmPluginRegex();

    [GeneratedRegex(@"id\s*[\(\s]['""]org\.jetbrains\.kotlin\.jvm['""]\)?\s+version\s+['""]([^'""]+)['""]")]
    private static partial Regex KotlinJvmPluginIdRegex();

    [GeneratedRegex(@"id\s*[\(\s]['""]org\.springframework\.boot['""]\)?\s+version\s+['""]([^'""]+)['""]")]
    private static partial Regex SpringBootPluginRegex();

    [GeneratedRegex(@"JavaLanguageVersion\.of\s*\(\s*['""]?(\d+)['""]?\s*\)")]
    private static partial Regex JavaToolchainRegex();

    [GeneratedRegex(@"jvmToolchain\s*\(\s*['""]?(\d+)['""]?\s*\)")]
    private static partial Regex JvmToolchainRegex();

    [GeneratedRegex(@"(?:source|target)Compatibility\s*[=:]\s*JavaVersion\.VERSION_(\d+)(?:_(\d+))?")]
    private static partial Regex JavaVersionConstantRegex();

    [GeneratedRegex(@"(?:source|target)Compatibility\s*[=:]\s*['""]?(\d[\d.]*)['""]?")]
    private static partial Regex JavaCompatibilityLiteralRegex();
}
