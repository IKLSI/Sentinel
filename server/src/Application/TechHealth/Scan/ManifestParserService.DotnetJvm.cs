using System.Text.Json;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Versioning;

namespace Sentinel.Application.TechHealth.Scan;

public partial class ManifestParserService
{
    private static void ParseCsproj(Guid projectId, string content, List<Dependency> deps, List<Runtime> runtimes)
    {
        try
        {
            XDocument doc = System.Xml.Linq.XDocument.Parse(content);

            string? tf = doc.Descendants("TargetFramework").FirstOrDefault()?.Value
                  ?? doc.Descendants("TargetFrameworks").FirstOrDefault()?.Value?.Split(';').FirstOrDefault();

            if (!string.IsNullOrEmpty(tf))
                runtimes.Add(new Runtime { ProjectId = projectId, Name = ".NET", Version = ParseDotNetVersion(tf) });

            foreach (XElement pkgRef in doc.Descendants("PackageReference"))
            {
                string name = pkgRef.Attribute("Include")?.Value ?? "";
                string version = pkgRef.Attribute("Version")?.Value ?? pkgRef.Element("Version")?.Value ?? "";
                if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(version)) continue;

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
        catch { }
    }

    private static string ParseDotNetVersion(string tf)
    {
        Match m1 = Regex.Match(tf, @"net(\d+\.\d+)");
        if (m1.Success) return m1.Groups[1].Value;
        Match m2 = Regex.Match(tf, @"net(\d+)");
        if (m2.Success) return m2.Groups[1].Value + ".0";
        return tf;
    }

    private static void ParsePomXml(Guid projectId, string content, List<Dependency> deps, List<Runtime> runtimes)
    {
        try
        {
            XDocument doc = System.Xml.Linq.XDocument.Parse(content);
            XNamespace ns = doc.Root?.Name.Namespace ?? System.Xml.Linq.XNamespace.None;

            Dictionary<string, string> properties = ReadMavenProperties(doc, ns);

            string? javaVersion = doc.Descendants(ns + "maven.compiler.source").FirstOrDefault()?.Value
                           ?? doc.Descendants(ns + "java.version").FirstOrDefault()?.Value;
            if (!string.IsNullOrEmpty(javaVersion))
                runtimes.Add(new Runtime { ProjectId = projectId, Name = "Java", Version = javaVersion });

            foreach (XElement dep in doc.Descendants(ns + "dependency"))
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
        catch { }
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

        Match reference = Regex.Match(trimmed, @"^\$\{([^}]+)\}$");
        if (!reference.Success) return trimmed;

        return properties.TryGetValue(reference.Groups[1].Value, out string? resolved) ? resolved : string.Empty;
    }

    private static void ParseDirectoryPackagesProps(Guid projectId, string content, List<Dependency> deps)
    {
        try
        {
            XDocument doc = System.Xml.Linq.XDocument.Parse(content);

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
        catch { }
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
                Match literal = Regex.Match(value, @"^[""']([^""']+)[""']");
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
        Match shorthand = Regex.Match(value, @"^[""']([a-zA-Z0-9.\-_]+:[a-zA-Z0-9.\-_]+):([^""']+)[""']$");
        if (shorthand.Success) return (shorthand.Groups[1].Value, shorthand.Groups[2].Value);

        string? module = null;

        Match moduleMatch = Regex.Match(value, @"module\s*=\s*[""']([^""']+)[""']");
        if (moduleMatch.Success)
        {
            module = moduleMatch.Groups[1].Value;
        }
        else
        {
            Match group = Regex.Match(value, @"group\s*=\s*[""']([^""']+)[""']");
            Match artifact = Regex.Match(value, @"name\s*=\s*[""']([^""']+)[""']");
            if (group.Success && artifact.Success) module = $"{group.Groups[1].Value}:{artifact.Groups[1].Value}";
        }

        if (module == null) return (null, null);

        Match versionReference = Regex.Match(value, @"version\.ref\s*=\s*[""']([^""']+)[""']");
        if (versionReference.Success)
        {
            return versions.TryGetValue(versionReference.Groups[1].Value, out string? resolved)
                ? (module, resolved)
                : (null, null);
        }

        Match literalVersion = Regex.Match(value, @"version\s*=\s*[""']([^""']+)[""']");

        return literalVersion.Success ? (module, literalVersion.Groups[1].Value) : (null, null);
    }

    private static void ParseBuildGradle(Guid projectId, string content, List<Dependency> deps, List<Runtime> runtimes)
    {
        Match javaVersionMatch = Regex.Match(content, @"sourceCompatibility\s*[=:]\s*['""]?(\d[\d.]*)['""]?");
        if (javaVersionMatch.Success)
            runtimes.Add(new Runtime { ProjectId = projectId, Name = "Java", Version = javaVersionMatch.Groups[1].Value });

        Match kotlinMatch = Regex.Match(content, @"kotlin\(['""]jvm['""]\)\s+version\s+['""]([^'""]+)['""]");
        if (kotlinMatch.Success)
            runtimes.Add(new Runtime { ProjectId = projectId, Name = "Kotlin", Version = kotlinMatch.Groups[1].Value });

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

    private static void ParseNuGetLockJson(Guid projectId, string content, List<Dependency> deps)
    {
        try
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
                        Ecosystem = DependencyEcosystem.NuGet,
                        Status = DependencyStatus.UpToDate,
                    });
                }
            }
        }
        catch { }
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

}
