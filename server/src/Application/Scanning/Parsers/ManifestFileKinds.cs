
namespace Sentinel.Application.Scanning.Parsers;

internal static class ManifestFileKinds
{
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

    private static readonly HashSet<string> RuntimeDeclarationFileNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "gradle-wrapper.properties",
        "global.json",
        "go.work",
        "runtime.txt",
        "Dockerfile",
        "rust-toolchain",
        "rust-toolchain.toml",
        ".tool-versions",
    };

    private static readonly string[] ProjectFileExtensions = [".csproj", ".fsproj", ".vbproj"];

    public static bool IsManifest(string name)
        => ManifestFileNames.Contains(name) || IsProjectFile(name);

    public static bool IsProjectFile(string name)
        => ProjectFileExtensions.Any(extension => name.EndsWith(extension, StringComparison.OrdinalIgnoreCase));

    public static bool IsLockFile(string name)
        => LockFileNames.Contains(name);

    public static bool ReportsDirectness(string name)
        => LockFilesReportingDirectness.Contains(name);

    public static bool IsRuntimeDeclaration(string name)
        => RuntimeDeclarationFileNames.Contains(name) || RuntimeFilesParser.IsVersionFile(name);

    public static int ScanPriority(string name)
    {
        if (IsRuntimeDeclaration(name)) return 0;

        return IsLockFile(name) ? 1 : 2;
    }
}
