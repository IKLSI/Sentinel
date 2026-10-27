using System.Text.Json;
using System.Text.RegularExpressions;
using static Sentinel.Application.Scanning.Parsers.ManifestEntries;

namespace Sentinel.Application.Scanning.Parsers;

internal sealed partial class RuntimeFilesParser : IManifestFileParser
{
    private const string CMakeLists = "CMakeLists.txt";
    private const string GlobalJson = "global.json";
    private const string GoWork = "go.work";
    private const string GradleWrapperProperties = "gradle-wrapper.properties";
    private const string RuntimeTxt = "runtime.txt";
    private const string RustToolchain = "rust-toolchain";
    private const string RustToolchainToml = "rust-toolchain.toml";
    private const string ToolVersions = ".tool-versions";

    private static readonly HashSet<string> FileNames = FileNameSet(CMakeLists, GlobalJson, GoWork,
        GradleWrapperProperties, RuntimeTxt, RustToolchain, RustToolchainToml, ToolVersions);

    private static readonly Dictionary<string, string> RuntimeByVersionFile = new(StringComparer.OrdinalIgnoreCase)
    {
        [".nvmrc"] = "Node.js",
        [".node-version"] = "Node.js",
        [".python-version"] = "Python",
        [".ruby-version"] = "Ruby",
        [".java-version"] = "Java",
        [".go-version"] = "Go",
    };

    private static readonly Dictionary<string, string> RuntimeByPlatform = new(StringComparer.OrdinalIgnoreCase)
    {
        ["python"] = "Python",
        ["ruby"] = "Ruby",
        ["nodejs"] = "Node.js",
        ["node"] = "Node.js",
        ["php"] = "PHP",
        ["dotnet"] = ".NET",
    };

    private static readonly Dictionary<string, string> RuntimeByTool = new(StringComparer.OrdinalIgnoreCase)
    {
        ["nodejs"] = "Node.js",
        ["node"] = "Node.js",
        ["python"] = "Python",
        ["ruby"] = "Ruby",
        ["golang"] = "Go",
        ["go"] = "Go",
        ["java"] = "Java",
        ["rust"] = "Rust",
        ["elixir"] = "Elixir",
        ["php"] = "PHP",
        ["deno"] = "Deno",
        ["bun"] = "Bun",
        ["dotnet"] = ".NET",
        ["dotnet-core"] = ".NET",
        ["kotlin"] = "Kotlin",
        ["dart"] = "Dart",
        ["flutter"] = "Flutter",
    };

    public static bool IsVersionFile(string fileName) => RuntimeByVersionFile.ContainsKey(fileName);

    public bool CanParse(string fileName) => FileNames.Contains(fileName) || IsVersionFile(fileName);

    public void Parse(ManifestDocument manifest, ManifestParseResult result)
    {
        if (manifest.Is(CMakeLists)) ParseCMakeLists(manifest, result);
        else if (manifest.Is(GlobalJson)) ParseGlobalJson(manifest, result);
        else if (manifest.Is(GoWork)) AddMatchedRuntime(manifest, result, "Go", GoDirectiveRegex());
        else if (manifest.Is(GradleWrapperProperties)) AddMatchedRuntime(manifest, result, "Gradle", GradleDistributionRegex());
        else if (manifest.Is(RuntimeTxt)) ParseRuntimeTxt(manifest, result);
        else if (manifest.Is(RustToolchain) || manifest.Is(RustToolchainToml)) ParseRustToolchain(manifest, result);
        else if (manifest.Is(ToolVersions)) ParseToolVersions(manifest, result);
        else ParseVersionFile(manifest, result);
    }

    private static void AddMatchedRuntime(ManifestDocument manifest, ManifestParseResult result, string runtimeName,
        Regex versionPattern)
    {
        Match version = versionPattern.Match(manifest.Content);

        if (version.Success)
            result.Runtimes.Add(NewRuntime(manifest.ProjectId, runtimeName, version.Groups[1].Value));
    }

    private static void ParseCMakeLists(ManifestDocument manifest, ManifestParseResult result)
    {
        Match cmakeVersionMatch = CMakeMinimumVersionRegex().Match(manifest.Content);

        if (!cmakeVersionMatch.Success) return;

        result.Runtimes.Add(NewRuntime(manifest.ProjectId, "CMake", cmakeVersionMatch.Groups[1].Value.TrimEnd('.')));

        Match cxxStandard = CxxStandardRegex().Match(manifest.Content);

        if (cxxStandard.Success)
            result.Runtimes.Add(NewRuntime(manifest.ProjectId, "C++", cxxStandard.Groups[1].Value));
    }

    private static void ParseGlobalJson(ManifestDocument manifest, ManifestParseResult result)
    {
        using JsonDocument doc = JsonDocument.Parse(manifest.Content);

        if (!doc.RootElement.TryGetProperty("sdk", out JsonElement sdk)) return;
        if (!sdk.TryGetProperty("version", out JsonElement versionProperty)) return;

        string? version = ReadDeclaredVersion(versionProperty.GetString() ?? string.Empty);
        if (version == null) return;

        string[] segments = version.Split('.');
        string runtimeVersion = segments.Length >= 2 ? $"{segments[0]}.{segments[1]}" : segments[0];

        result.Runtimes.Add(NewRuntime(manifest.ProjectId, ".NET", runtimeVersion));
    }

    private static void ParseRuntimeTxt(ManifestDocument manifest, ManifestParseResult result)
    {
        Match declaration = RuntimeDeclarationRegex().Match(manifest.Content.Trim());
        if (!declaration.Success) return;

        if (!RuntimeByPlatform.TryGetValue(declaration.Groups[1].Value, out string? runtimeName)) return;

        result.Runtimes.Add(NewRuntime(manifest.ProjectId, runtimeName, declaration.Groups[2].Value.TrimEnd('.')));
    }

    private static void ParseRustToolchain(ManifestDocument manifest, ManifestParseResult result)
    {
        Match channel = RustChannelRegex().Match(manifest.Content);
        string declared = channel.Success ? channel.Groups[1].Value : manifest.Content.Trim();

        string? version = ReadDeclaredVersion(declared);
        if (version == null) return;

        result.Runtimes.Add(NewRuntime(manifest.ProjectId, "Rust", version));
    }

    private static void ParseToolVersions(ManifestDocument manifest, ManifestParseResult result)
    {
        foreach (string raw in manifest.Content.Split('\n'))
        {
            string line = raw.Trim();
            if (line.Length == 0 || line.StartsWith('#')) continue;

            string[] parts = line.Split([' ', '\t'], StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length < 2) continue;

            if (!RuntimeByTool.TryGetValue(parts[0], out string? runtimeName)) continue;

            string? version = ReadDeclaredVersion(parts[1]);
            if (version == null) continue;

            result.Runtimes.Add(NewRuntime(manifest.ProjectId, runtimeName, version));
        }
    }

    private static void ParseVersionFile(ManifestDocument manifest, ManifestParseResult result)
    {
        string runtimeName = RuntimeByVersionFile[manifest.FileName];
        string? version = ReadDeclaredVersion(manifest.Content.Split('\n').FirstOrDefault() ?? string.Empty);

        if (version != null)
            result.Runtimes.Add(NewRuntime(manifest.ProjectId, runtimeName, version));
    }

    [GeneratedRegex(@"cmake_minimum_required\s*\(\s*VERSION\s+([\d.]+)", RegexOptions.IgnoreCase)]
    private static partial Regex CMakeMinimumVersionRegex();

    [GeneratedRegex(@"CMAKE_CXX_STANDARD\s+(\d+)", RegexOptions.IgnoreCase)]
    private static partial Regex CxxStandardRegex();

    [GeneratedRegex(@"^go\s+([\d.]+)", RegexOptions.Multiline)]
    private static partial Regex GoDirectiveRegex();

    [GeneratedRegex(@"distributionUrl=.*gradle-(\d+(?:\.\d+)*)-(?:bin|all)\.zip")]
    private static partial Regex GradleDistributionRegex();

    [GeneratedRegex(@"^([a-zA-Z.\-]+)-v?([\d.]+)")]
    private static partial Regex RuntimeDeclarationRegex();

    [GeneratedRegex(@"channel\s*=\s*[""']([^""']+)[""']")]
    private static partial Regex RustChannelRegex();
}
