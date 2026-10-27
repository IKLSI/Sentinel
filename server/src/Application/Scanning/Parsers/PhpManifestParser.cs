using System.Text.Json;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Parsing;
using Sentinel.Domain.Versioning;
using static Sentinel.Application.Scanning.Parsers.ManifestEntries;

namespace Sentinel.Application.Scanning.Parsers;

internal sealed class PhpManifestParser : IManifestFileParser
{
    private const string ComposerJson = "composer.json";
    private const string ComposerLock = "composer.lock";

    private static readonly HashSet<string> FileNames = FileNameSet(ComposerJson, ComposerLock);

    private static readonly HashSet<string> SymfonyRuntimePackages = new(StringComparer.OrdinalIgnoreCase)
    {
        "symfony/symfony",
        "symfony/framework-bundle",
        "symfony/runtime",
    };

    public bool CanParse(string fileName) => FileNames.Contains(fileName);

    public void Parse(ManifestDocument manifest, ManifestParseResult result)
    {
        if (manifest.Is(ComposerJson)) ParseComposerJson(manifest, result);
        else ParseComposerLock(manifest, result);
    }

    private static void ParseComposerJson(ManifestDocument manifest, ManifestParseResult result)
    {
        using JsonDocument doc = JsonDocument.Parse(manifest.Content);
        JsonElement root = doc.RootElement;

        if (root.TryGetProperty("require", out JsonElement require))
        {
            foreach (JsonProperty requirement in require.EnumerateObject())
                AddRequirement(manifest.ProjectId, requirement, result);
        }

        if (root.TryGetProperty("require-dev", out JsonElement requireDev))
        {
            foreach (JsonProperty requirement in requireDev.EnumerateObject())
                AddDevRequirement(manifest.ProjectId, requirement, result.Dependencies);
        }
    }

    private static void AddRequirement(Guid projectId, JsonProperty requirement, ManifestParseResult result)
    {
        string specification = requirement.Value.GetString() ?? "";
        string version = VersionText.Clean(specification);
        if (!VersionText.StartsWithDigit(version)) return;

        if (requirement.Name.Equals("php", StringComparison.OrdinalIgnoreCase))
        {
            result.Runtimes.Add(ConstrainedRuntime(projectId, "PHP", version, specification));
            return;
        }

        string? framework = FrameworkRuntime(requirement.Name);
        if (framework != null) result.Runtimes.Add(ConstrainedRuntime(projectId, framework, version, specification));

        result.Dependencies.Add(NewComposerDependency(projectId, requirement.Name, version, specification,
            DependencyType.Prod));
    }

    private static void AddDevRequirement(Guid projectId, JsonProperty requirement, List<Dependency> deps)
    {
        string specification = requirement.Value.GetString() ?? "";
        string version = VersionText.Clean(specification);
        if (!VersionText.StartsWithDigit(version)) return;

        deps.Add(NewComposerDependency(projectId, requirement.Name, version, specification, DependencyType.Dev));
    }

    private static string? FrameworkRuntime(string packageName)
    {
        if (packageName.Equals("laravel/framework", StringComparison.OrdinalIgnoreCase)) return "Laravel";

        return SymfonyRuntimePackages.Contains(packageName) ? "Symfony" : null;
    }

    private static Dependency NewComposerDependency(Guid projectId, string name, string version,
        string specification, DependencyType type) => new()
    {
        ProjectId = projectId,
        Name = name,
        CurrentVersion = version,
        IsVersionPinned = VersionText.IsExact(specification),
        Type = type,
        Ecosystem = DependencyEcosystem.Composer,
    };

    private static void ParseComposerLock(ManifestDocument manifest, ManifestParseResult result)
    {
        using JsonDocument doc = JsonDocument.Parse(manifest.Content);
        JsonElement root = doc.RootElement;

        foreach ((string section, DependencyType type) in new[] { ("packages", DependencyType.Prod), ("packages-dev", DependencyType.Dev) })
        {
            if (!root.TryGetProperty(section, out JsonElement packages)) continue;

            foreach (JsonElement package in packages.EnumerateArray())
            {
                string name = package.StringProperty("name") ?? "";
                string version = VersionText.Clean(package.StringProperty("version") ?? "");

                if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(version)) continue;

                result.Dependencies.Add(NewDependency(manifest.ProjectId, name, version,
                    DependencyEcosystem.Composer, type));
            }
        }
    }
}
