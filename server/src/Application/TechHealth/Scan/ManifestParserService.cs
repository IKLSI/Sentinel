using System.Text.RegularExpressions;
using Sentinel.Domain.Entities;

namespace Sentinel.Application.TechHealth.Scan;

public sealed record ManifestParseOutcome(List<Dependency> Dependencies, List<Runtime> Runtimes,
    Exception? Failure);

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

    [GeneratedRegex(@"^(?:[A-Za-z][A-Za-z0-9+.\-]*://|git\+)")]
    private static partial Regex RequirementUrlRegex();

    [GeneratedRegex(@"#egg=([A-Za-z0-9][A-Za-z0-9._-]*)")]
    private static partial Regex RequirementEggRegex();

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
        "Gemfile.lock",
        "uv.lock",
        "bun.lock",
        "packages.config",
        "Podfile.lock",
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
        "Directory.Build.props",
        "libs.versions.toml",
        "global.json",
        "go.work",
        "runtime.txt",
        "Dockerfile",
        "rust-toolchain",
        "rust-toolchain.toml",
        ".tool-versions",
        ".nvmrc",
        ".node-version",
        ".python-version",
        ".ruby-version",
        ".java-version",
        ".go-version",
        "gradle-wrapper.properties",
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
        "Gemfile.lock",
        "uv.lock",
        "bun.lock",
        "Podfile.lock",
    };

    private static readonly HashSet<string> LockFilesReportingDirectness = new(StringComparer.OrdinalIgnoreCase)
    {
        "package-lock.json",
        "packages.lock.json",
        "Gemfile.lock",
        "pubspec.lock",
        "Podfile.lock",
        "Package.resolved",
    };

    private static readonly string[] ProjectFileExtensions = [".csproj", ".fsproj", ".vbproj"];

    public static bool IsManifest(string name)
        => ManifestFileNames.Contains(name) || IsProjectFile(name);

    private static bool IsProjectFile(string name)
        => ProjectFileExtensions.Any(extension => name.EndsWith(extension, StringComparison.OrdinalIgnoreCase));

    public static bool IsLockFile(string name)
        => LockFileNames.Contains(name);

    public static bool ReportsDirectness(string name)
        => LockFilesReportingDirectness.Contains(name);

    public static int ScanPriority(string name)
    {
        if (IsRuntimeDeclaration(name)) return 0;

        return IsLockFile(name) ? 1 : 2;
    }

    public (List<Dependency>, List<Runtime>) Parse(Guid projectId, string fileName, string content)
    {
        ManifestParseOutcome outcome = ParseReportingFailure(projectId, fileName, content);

        return (outcome.Dependencies, outcome.Runtimes);
    }

    public ManifestParseOutcome ParseReportingFailure(Guid projectId, string fileName, string content)
    {
        List<Dependency> deps = new List<Dependency>();
        List<Runtime> runtimes = new List<Runtime>();
        Exception? failure = null;

        try
        {
            ParseInto(projectId, fileName, content, deps, runtimes);
        }
        catch (Exception exception)
        {
            failure = exception;
        }

        if (!IsLockFile(fileName)) AddDependencyDerivedRuntimes(projectId, deps, runtimes);

        return new ManifestParseOutcome(deps, runtimes, failure);
    }

    private static void ParseInto(Guid projectId, string fileName, string content, List<Dependency> deps,
        List<Runtime> runtimes)
    {
        string lower = fileName.ToLowerInvariant();

        if (lower == "package.json") ParsePackageJson(projectId, content, deps, runtimes);
        else if (lower == "package-lock.json") ParsePackageLockJson(projectId, content, deps);
        else if (lower == "yarn.lock") ParseYarnLock(projectId, content, deps);
        else if (lower == "pnpm-lock.yaml") ParsePnpmLock(projectId, content, deps);
        else if (lower is "directory.build.props" || IsProjectFile(lower)) ParseCsproj(projectId, content, deps, runtimes);
        else if (lower == "pom.xml") ParsePomXml(projectId, content, deps, runtimes);
        else if (lower == "requirements.txt") ParseRequirementsTxt(projectId, content, deps, runtimes);
        else if (lower == "pipfile.lock") ParsePipfileLock(projectId, content, deps);
        else if (lower == "pyproject.toml") ParsePyprojectToml(projectId, content, deps, runtimes);
        else if (lower == "go.mod") ParseGoMod(projectId, content, deps, runtimes);
        else if (lower == "composer.json") ParseComposerJson(projectId, content, deps, runtimes);
        else if (lower == "composer.lock") ParseComposerLock(projectId, content, deps);
        else if (lower is "build.gradle" or "build.gradle.kts") ParseBuildGradle(projectId, content, deps, runtimes);
        else if (lower == "gemfile") ParseGemfile(projectId, content, deps, runtimes);
        else if (lower == "gemfile.lock") ParseGemfileLock(projectId, content, deps);
        else if (lower == "uv.lock") ParseUvLock(projectId, content, deps);
        else if (lower == "bun.lock") ParseBunLock(projectId, content, deps);
        else if (lower == "packages.config") ParsePackagesConfig(projectId, content, deps);
        else if (lower == "podfile.lock") ParsePodfileLock(projectId, content, deps);
        else if (fileName == WorkflowFileName) ParseWorkflow(projectId, content, deps);
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
        else if (lower == "global.json") ParseGlobalJson(projectId, content, runtimes);
        else if (lower == "go.work") ParseGoWork(projectId, content, runtimes);
        else if (lower == "runtime.txt") ParseRuntimeTxt(projectId, content, runtimes);
        else if (lower == "dockerfile") ParseDockerfile(projectId, content, runtimes);
        else if (lower is "rust-toolchain" or "rust-toolchain.toml") ParseRustToolchain(projectId, content, runtimes);
        else if (lower == ".tool-versions") ParseToolVersions(projectId, content, runtimes);
        else if (lower == "gradle-wrapper.properties") ParseGradleWrapperProperties(projectId, content, runtimes);
        else if (VersionFileRuntimes.ContainsKey(lower)) ParseVersionFile(projectId, lower, content, runtimes);
    }

    private static Dependency NewDependency(Guid projectId, string name, string version,
        DependencyEcosystem ecosystem, DependencyType type = DependencyType.Prod) => new()
    {
        ProjectId = projectId,
        Name = name,
        CurrentVersion = version,
        Type = type,
        Ecosystem = ecosystem,
    };

}
