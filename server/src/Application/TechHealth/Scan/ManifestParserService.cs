using System.Text.Json;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Versioning;

namespace Sentinel.Application.TechHealth.Scan;

public partial class ManifestParserService
{
    [GeneratedRegex(@"(?:implementation|api|compileOnly|runtimeOnly|testImplementation|testRuntimeOnly|annotationProcessor|classpath)\s*[('""]([a-zA-Z0-9.\-_]+:[a-zA-Z0-9.\-_]+:[a-zA-Z0-9.\-_]+)['"")]", RegexOptions.Multiline)]
    private static partial Regex CoordPatternRegex();

    [GeneratedRegex(@"(?:implementation|api|compileOnly|runtimeOnly|testImplementation)\s+group\s*:\s*['""]([^'""]+)['""]\s*,\s*name\s*:\s*['""]([^'""]+)['""]\s*,\s*version\s*:\s*['""]([^'""]+)['""]", RegexOptions.Multiline)]
    private static partial Regex NamedPatternRegex();

    [GeneratedRegex(@"^gem\s+['""]([^'""]+)['""](?:\s*,\s*['""]([^'""]*)['""])?", RegexOptions.Multiline)]
    private static partial Regex GemPatternRegex();

    [GeneratedRegex(@"^([A-Za-z0-9][A-Za-z0-9._-]*)")]
    private static partial Regex RequirementNameRegex();

    [GeneratedRegex(@"==\s*([A-Za-z0-9][A-Za-z0-9.*\-_+!]*)")]
    private static partial Regex RequirementPinnedVersionRegex();

    [GeneratedRegex(@"(?:~=|>=|>)\s*([A-Za-z0-9][A-Za-z0-9.\-_+!]*)")]
    private static partial Regex RequirementMinimumVersionRegex();

    private static readonly HashSet<string> ManifestFileNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "package.json",
        "package-lock.json",
        "yarn.lock",
        "pnpm-lock.yaml",
        "requirements.txt",
        "Pipfile.lock",
        "go.mod",
        "composer.json",
        "composer.lock",
        "pom.xml",
        "build.gradle",
        "build.gradle.kts",
        "Gemfile",
        "Cargo.toml",
        "pyproject.toml",
        "CMakeLists.txt",
        "Cargo.lock",
        "packages.lock.json",
        "poetry.lock",
        "gradle.lockfile",
        "mix.exs",
        "mix.lock",
        "pubspec.yaml",
        "pubspec.lock",
        "Package.swift",
        "Package.resolved",
        "Directory.Packages.props",
        "libs.versions.toml",
    };

    private static readonly HashSet<string> LockFileNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "package-lock.json",
        "yarn.lock",
        "pnpm-lock.yaml",
        "Pipfile.lock",
        "composer.lock",
        "Cargo.lock",
        "packages.lock.json",
        "poetry.lock",
        "gradle.lockfile",
        "mix.lock",
        "pubspec.lock",
        "Package.resolved",
    };

    public static bool IsManifest(string name)
        => ManifestFileNames.Contains(name) || name.EndsWith(".csproj", StringComparison.OrdinalIgnoreCase);

    public static bool IsLockFile(string name)
        => LockFileNames.Contains(name);

    public (List<Dependency>, List<Runtime>) Parse(Guid projectId, string fileName, string content)
    {
        List<Dependency> deps = new List<Dependency>();
        List<Runtime> runtimes = new List<Runtime>();
        string lower = fileName.ToLowerInvariant();

        if (lower == "package.json") ParsePackageJson(projectId, content, deps, runtimes);
        else if (lower == "package-lock.json") ParsePackageLockJson(projectId, content, deps);
        else if (lower == "yarn.lock") ParseYarnLock(projectId, content, deps);
        else if (lower == "pnpm-lock.yaml") ParsePnpmLock(projectId, content, deps);
        else if (lower.EndsWith(".csproj")) ParseCsproj(projectId, content, deps, runtimes);
        else if (lower == "pom.xml") ParsePomXml(projectId, content, deps, runtimes);
        else if (lower == "requirements.txt") ParseRequirementsTxt(projectId, content, deps, runtimes);
        else if (lower == "pipfile.lock") ParsePipfileLock(projectId, content, deps);
        else if (lower == "pyproject.toml") ParsePyprojectToml(projectId, content, deps, runtimes);
        else if (lower == "go.mod") ParseGoMod(projectId, content, deps, runtimes);
        else if (lower == "composer.json") ParseComposerJson(projectId, content, deps, runtimes);
        else if (lower == "composer.lock") ParseComposerLock(projectId, content, deps);
        else if (lower is "build.gradle" or "build.gradle.kts") ParseBuildGradle(projectId, content, deps, runtimes);
        else if (lower == "gemfile") ParseGemfile(projectId, content, deps, runtimes);
        else if (lower == "cargo.toml") ParseCargoToml(projectId, content, deps, runtimes);
        else if (lower == "cmakelists.txt") ParseCMakeLists(projectId, content, runtimes);
        else if (lower == "cargo.lock") ParseCargoLock(projectId, content, deps);
        else if (lower == "packages.lock.json") ParseNuGetLockJson(projectId, content, deps);
        else if (lower == "poetry.lock") ParsePoetryLock(projectId, content, deps);
        else if (lower == "gradle.lockfile") ParseGradleLockfile(projectId, content, deps);
        else if (lower == "mix.exs") ParseMixExs(projectId, content, deps, runtimes);
        else if (lower == "mix.lock") ParseMixLock(projectId, content, deps);
        else if (lower == "pubspec.yaml") ParsePubspecYaml(projectId, content, deps, runtimes);
        else if (lower == "pubspec.lock") ParsePubspecLock(projectId, content, deps);
        else if (lower == "package.swift") ParsePackageSwift(projectId, content, runtimes);
        else if (lower == "package.resolved") ParsePackageResolved(projectId, content, deps);
        else if (lower == "directory.packages.props") ParseDirectoryPackagesProps(projectId, content, deps);
        else if (lower == "libs.versions.toml") ParseVersionCatalog(projectId, content, deps);

        return (deps, runtimes);
    }

}
