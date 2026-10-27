using System.Text.RegularExpressions;
using System.Xml.Linq;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Parsing;
using static Sentinel.Application.Scanning.Parsers.ManifestEntries;

namespace Sentinel.Application.Scanning.Parsers;

internal sealed partial class JvmManifestParser : IManifestFileParser
{
    private const string MavenPom = "pom.xml";
    private const string GradleBuild = "build.gradle";
    private const string GradleKotlinBuild = "build.gradle.kts";
    private const string GradleLockfile = "gradle.lockfile";
    private const string GradleVersionCatalog = "libs.versions.toml";

    private static readonly HashSet<string> FileNames =
        FileNameSet(MavenPom, GradleBuild, GradleKotlinBuild, GradleLockfile, GradleVersionCatalog);

    public bool CanParse(string fileName) => FileNames.Contains(fileName);

    public void Parse(ManifestDocument manifest, ManifestParseResult result)
    {
        if (manifest.Is(MavenPom)) ParseMavenPom(manifest, result);
        else if (manifest.Is(GradleLockfile)) ParseGradleLockfile(manifest, result);
        else if (manifest.Is(GradleVersionCatalog)) ParseGradleVersionCatalog(manifest, result);
        else ParseGradleBuild(manifest, result);
    }

    private static void ParseMavenPom(ManifestDocument manifest, ManifestParseResult result)
    {
        Guid projectId = manifest.ProjectId;
        XDocument doc = UntrustedXml.Parse(manifest.Content);
        XNamespace ns = doc.Root?.Name.Namespace ?? XNamespace.None;

        Dictionary<string, string> properties = ReadPomProperties(doc, ns);

        string javaVersion = ResolvePomVersion(ReadPomJavaVersion(doc, ns) ?? string.Empty, properties);
        if (!string.IsNullOrEmpty(javaVersion))
            result.Runtimes.Add(NewRuntime(projectId, "Java", javaVersion));

        string? springBootVersion = ReadSpringBootParentVersion(doc, ns);
        if (!string.IsNullOrEmpty(springBootVersion))
            result.Runtimes.Add(NewRuntime(projectId, "Spring Boot", springBootVersion));

        foreach (XElement dep in doc.Descendants(ns + "dependency").Where(IsProjectDependency))
        {
            string groupId = dep.Element(ns + "groupId")?.Value ?? "";
            string artifactId = dep.Element(ns + "artifactId")?.Value ?? "";
            string version = ResolvePomVersion(dep.Element(ns + "version")?.Value ?? "", properties);
            string scope = dep.Element(ns + "scope")?.Value ?? "compile";

            if (string.IsNullOrEmpty(artifactId) || string.IsNullOrEmpty(version) || version.StartsWith('$')) continue;

            string name = string.IsNullOrEmpty(groupId) ? artifactId : $"{groupId}:{artifactId}";
            result.Dependencies.Add(NewDependency(projectId, name, version,
                DependencyEcosystem.Maven, scope == "test" ? DependencyType.Dev : DependencyType.Prod));
        }
    }

    private static string? ReadPomJavaVersion(XDocument doc, XNamespace ns) =>
        doc.Descendants(ns + "maven.compiler.release").FirstOrDefault()?.Value
        ?? doc.Descendants(ns + "maven.compiler.source").FirstOrDefault()?.Value
        ?? doc.Descendants(ns + "maven.compiler.target").FirstOrDefault()?.Value
        ?? doc.Descendants(ns + "java.version").FirstOrDefault()?.Value;

    private static bool IsProjectDependency(XElement dependency) =>
        !dependency.Ancestors().Any(ancestor => ancestor.Name.LocalName is "dependencyManagement" or "plugin");

    private static string? ReadSpringBootParentVersion(XDocument doc, XNamespace ns)
    {
        XElement? parent = doc.Descendants(ns + "parent")
            .FirstOrDefault(p => p.Element(ns + "artifactId")?.Value == "spring-boot-starter-parent");

        return parent?.Element(ns + "version")?.Value;
    }

    private static Dictionary<string, string> ReadPomProperties(XDocument doc, XNamespace ns)
    {
        Dictionary<string, string> properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        foreach (XElement property in doc.Descendants(ns + "properties").Elements())
        {
            string value = property.Value.Trim();
            if (!string.IsNullOrEmpty(value)) properties.TryAdd(property.Name.LocalName, value);
        }

        return properties;
    }

    private static string ResolvePomVersion(string version, Dictionary<string, string> properties)
    {
        string trimmed = version.Trim();

        Match reference = PomPropertyReferenceRegex().Match(trimmed);
        if (!reference.Success) return trimmed;

        return properties.TryGetValue(reference.Groups[1].Value, out string? resolved) ? resolved : string.Empty;
    }

    private static void ParseGradleBuild(ManifestDocument manifest, ManifestParseResult result)
    {
        Guid projectId = manifest.ProjectId;
        string content = manifest.Content;

        AddGradleRuntimes(projectId, content, result.Runtimes);

        foreach (Match m in GradleCoordinatesRegex().Matches(content))
        {
            string[] parts = m.Groups[1].Value.Split(':');
            if (parts.Length < 3) continue;

            bool isTest = m.Value.TrimStart().StartsWith("test", StringComparison.OrdinalIgnoreCase);

            result.Dependencies.Add(NewDependency(projectId, $"{parts[0]}:{parts[1]}", parts[2],
                DependencyEcosystem.Maven, isTest ? DependencyType.Dev : DependencyType.Prod));
        }

        foreach (Match m in GradleNamedCoordinatesRegex().Matches(content))
        {
            result.Dependencies.Add(NewDependency(projectId, $"{m.Groups[1].Value}:{m.Groups[2].Value}",
                m.Groups[3].Value, DependencyEcosystem.Maven));
        }
    }

    private static void AddGradleRuntimes(Guid projectId, string content, List<Runtime> runtimes)
    {
        string? javaVersion = ReadGradleJavaVersion(content);
        if (javaVersion != null)
            runtimes.Add(NewRuntime(projectId, "Java", javaVersion));

        Match kotlinMatch = KotlinJvmPluginRegex().Match(content);
        if (!kotlinMatch.Success)
            kotlinMatch = KotlinJvmPluginIdRegex().Match(content);
        if (kotlinMatch.Success)
            runtimes.Add(NewRuntime(projectId, "Kotlin", kotlinMatch.Groups[1].Value));

        Match springBootMatch = SpringBootPluginRegex().Match(content);
        if (springBootMatch.Success)
            runtimes.Add(NewRuntime(projectId, "Spring Boot", springBootMatch.Groups[1].Value));
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

    private static void ParseGradleLockfile(ManifestDocument manifest, ManifestParseResult result)
    {
        foreach (string raw in manifest.Content.Split('\n'))
        {
            string line = raw.Trim();
            if (line.StartsWith('#') || string.IsNullOrEmpty(line)) continue;

            int equals = line.IndexOf('=');
            if (equals <= 0) continue;

            string[] coordinates = line[..equals].Split(':');
            if (coordinates.Length < 3) continue;

            bool isTest = line[(equals + 1)..].Contains("test", StringComparison.OrdinalIgnoreCase);

            result.Dependencies.Add(NewDependency(manifest.ProjectId, $"{coordinates[0]}:{coordinates[1]}",
                coordinates[2], DependencyEcosystem.Maven, isTest ? DependencyType.Dev : DependencyType.Prod));
        }
    }

    private static void ParseGradleVersionCatalog(ManifestDocument manifest, ManifestParseResult result)
    {
        Dictionary<string, string> versions = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        List<string> libraries = new List<string>();
        string? section = null;

        foreach (string raw in manifest.Content.Split('\n'))
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
                Match literal = TomlManifest.QuotedLiteralPrefix().Match(value);
                if (literal.Success) versions[key] = literal.Groups[1].Value;
                continue;
            }

            if (section == "libraries") libraries.Add(value);
        }

        foreach (string library in libraries)
        {
            (string? name, string? version) = ResolveCatalogLibrary(library, versions);
            if (name == null || version == null) continue;

            result.Dependencies.Add(NewDependency(manifest.ProjectId, name, version, DependencyEcosystem.Maven));
        }
    }

    private static (string? Name, string? Version) ResolveCatalogLibrary(string value,
        Dictionary<string, string> versions)
    {
        Match shorthand = CatalogShorthandRegex().Match(value);
        if (shorthand.Success) return (shorthand.Groups[1].Value, shorthand.Groups[2].Value);

        string? module = ReadCatalogModule(value);
        if (module == null) return (null, null);

        Match versionReference = CatalogVersionRefRegex().Match(value);
        if (versionReference.Success)
        {
            return versions.TryGetValue(versionReference.Groups[1].Value, out string? resolved)
                ? (module, resolved)
                : (null, null);
        }

        Match literalVersion = TomlManifest.InlineTableVersion().Match(value);

        return literalVersion.Success ? (module, literalVersion.Groups[1].Value) : (null, null);
    }

    private static string? ReadCatalogModule(string value)
    {
        Match module = CatalogModuleRegex().Match(value);
        if (module.Success) return module.Groups[1].Value;

        Match group = CatalogGroupRegex().Match(value);
        Match artifact = CatalogNameRegex().Match(value);

        return group.Success && artifact.Success ? $"{group.Groups[1].Value}:{artifact.Groups[1].Value}" : null;
    }

    [GeneratedRegex(@"^\$\{([^}]+)\}$")]
    private static partial Regex PomPropertyReferenceRegex();

    [GeneratedRegex(@"(?:implementation|api|compileOnly|runtimeOnly|testImplementation|testRuntimeOnly|annotationProcessor|classpath)\s*[('""]([a-zA-Z0-9.\-_]+:[a-zA-Z0-9.\-_]+:[a-zA-Z0-9.\-_]+)['"")]", RegexOptions.Multiline)]
    private static partial Regex GradleCoordinatesRegex();

    [GeneratedRegex(@"(?:implementation|api|compileOnly|runtimeOnly|testImplementation)\s+group\s*:\s*['""]([^'""]+)['""]\s*,\s*name\s*:\s*['""]([^'""]+)['""]\s*,\s*version\s*:\s*['""]([^'""]+)['""]", RegexOptions.Multiline)]
    private static partial Regex GradleNamedCoordinatesRegex();

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

    [GeneratedRegex(@"^[""']([a-zA-Z0-9.\-_]+:[a-zA-Z0-9.\-_]+):([^""']+)[""']$")]
    private static partial Regex CatalogShorthandRegex();

    [GeneratedRegex(@"module\s*=\s*[""']([^""']+)[""']")]
    private static partial Regex CatalogModuleRegex();

    [GeneratedRegex(@"group\s*=\s*[""']([^""']+)[""']")]
    private static partial Regex CatalogGroupRegex();

    [GeneratedRegex(@"name\s*=\s*[""']([^""']+)[""']")]
    private static partial Regex CatalogNameRegex();

    [GeneratedRegex(@"version\.ref\s*=\s*[""']([^""']+)[""']")]
    private static partial Regex CatalogVersionRefRegex();
}
