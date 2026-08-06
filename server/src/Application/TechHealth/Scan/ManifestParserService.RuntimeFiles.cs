using System.Text.Json;
using System.Text.RegularExpressions;
using Sentinel.Domain.Entities;

namespace Sentinel.Application.TechHealth.Scan;

public partial class ManifestParserService
{
    private static readonly Dictionary<string, string> VersionFileRuntimes = new(StringComparer.OrdinalIgnoreCase)
    {
        [".nvmrc"] = "Node.js",
        [".node-version"] = "Node.js",
        [".python-version"] = "Python",
        [".ruby-version"] = "Ruby",
        [".java-version"] = "Java",
        [".go-version"] = "Go",
    };

    private static readonly Dictionary<string, string> ToolVersionRuntimes = new(StringComparer.OrdinalIgnoreCase)
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

    private static readonly Dictionary<string, string> DockerBaseImageRuntimes = new(StringComparer.OrdinalIgnoreCase)
    {
        ["node"] = "Node.js",
        ["python"] = "Python",
        ["php"] = "PHP",
        ["ruby"] = "Ruby",
        ["golang"] = "Go",
        ["rust"] = "Rust",
        ["openjdk"] = "Java",
        ["eclipse-temurin"] = "Java",
        ["amazoncorretto"] = "Java",
        ["ibmjava"] = "Java",
        ["elixir"] = "Elixir",
        ["denoland/deno"] = "Deno",
        ["oven/bun"] = "Bun",
        ["mcr.microsoft.com/dotnet/sdk"] = ".NET",
        ["mcr.microsoft.com/dotnet/aspnet"] = ".NET",
        ["mcr.microsoft.com/dotnet/runtime"] = ".NET",
        ["dart"] = "Dart",
    };

    private static readonly HashSet<string> RuntimeDeclarationFileNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "global.json",
        "go.work",
        "runtime.txt",
        "Dockerfile",
        "rust-toolchain",
        "rust-toolchain.toml",
        ".tool-versions",
    };

    public static bool IsRuntimeDeclaration(string name)
        => RuntimeDeclarationFileNames.Contains(name) || VersionFileRuntimes.ContainsKey(name);

    private static void ParseVersionFile(Guid projectId, string fileName, string content, List<Runtime> runtimes)
    {
        string runtimeName = VersionFileRuntimes[fileName];
        string? version = ReadDeclaredVersion(content.Split('\n').FirstOrDefault() ?? string.Empty);

        if (version != null)
            runtimes.Add(new Runtime { ProjectId = projectId, Name = runtimeName, Version = version });
    }

    private static void ParseToolVersions(Guid projectId, string content, List<Runtime> runtimes)
    {
        foreach (string raw in content.Split('\n'))
        {
            string line = raw.Trim();
            if (line.Length == 0 || line.StartsWith('#')) continue;

            string[] parts = line.Split([' ', '\t'], StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length < 2) continue;

            if (!ToolVersionRuntimes.TryGetValue(parts[0], out string? runtimeName)) continue;

            string? version = ReadDeclaredVersion(parts[1]);
            if (version == null) continue;

            runtimes.Add(new Runtime { ProjectId = projectId, Name = runtimeName, Version = version });
        }
    }

    private static void ParseGlobalJson(Guid projectId, string content, List<Runtime> runtimes)
    {
        try
        {
            using JsonDocument doc = JsonDocument.Parse(content);

            if (!doc.RootElement.TryGetProperty("sdk", out JsonElement sdk)) return;
            if (!sdk.TryGetProperty("version", out JsonElement versionProperty)) return;

            string? version = ReadDeclaredVersion(versionProperty.GetString() ?? string.Empty);
            if (version == null) return;

            string[] segments = version.Split('.');
            string runtimeVersion = segments.Length >= 2 ? $"{segments[0]}.{segments[1]}" : segments[0];

            runtimes.Add(new Runtime { ProjectId = projectId, Name = ".NET", Version = runtimeVersion });
        }
        catch { }
    }

    private static void ParseGoWork(Guid projectId, string content, List<Runtime> runtimes)
    {
        Match goVersion = Regex.Match(content, @"^go\s+([\d.]+)", RegexOptions.Multiline);

        if (goVersion.Success)
            runtimes.Add(new Runtime { ProjectId = projectId, Name = "Go", Version = goVersion.Groups[1].Value });
    }

    private static void ParseRuntimeTxt(Guid projectId, string content, List<Runtime> runtimes)
    {
        Match declaration = Regex.Match(content.Trim(), @"^([a-zA-Z.\-]+)-v?([\d.]+)");
        if (!declaration.Success) return;

        Dictionary<string, string> platforms = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["python"] = "Python",
            ["ruby"] = "Ruby",
            ["nodejs"] = "Node.js",
            ["node"] = "Node.js",
            ["php"] = "PHP",
            ["dotnet"] = ".NET",
        };

        if (!platforms.TryGetValue(declaration.Groups[1].Value, out string? runtimeName)) return;

        runtimes.Add(new Runtime
        {
            ProjectId = projectId,
            Name = runtimeName,
            Version = declaration.Groups[2].Value.TrimEnd('.')
        });
    }

    private static void ParseRustToolchain(Guid projectId, string content, List<Runtime> runtimes)
    {
        Match channel = Regex.Match(content, @"channel\s*=\s*[""']([^""']+)[""']");
        string declared = channel.Success ? channel.Groups[1].Value : content.Trim();

        string? version = ReadDeclaredVersion(declared);
        if (version == null) return;

        runtimes.Add(new Runtime { ProjectId = projectId, Name = "Rust", Version = version });
    }

    private static void ParseDockerfile(Guid projectId, string content, List<Runtime> runtimes)
    {
        foreach (Match from in Regex.Matches(content, @"^\s*FROM\s+(\S+)", RegexOptions.Multiline | RegexOptions.IgnoreCase))
        {
            string reference = from.Groups[1].Value;

            int digest = reference.IndexOf('@');
            if (digest >= 0) reference = reference[..digest];

            int tagSeparator = reference.LastIndexOf(':');
            if (tagSeparator <= 0) continue;

            string image = reference[..tagSeparator];
            string tag = reference[(tagSeparator + 1)..];

            if (tag.Length == 0 || !char.IsDigit(tag[0])) continue;
            if (!DockerBaseImageRuntimes.TryGetValue(image, out string? runtimeName)) continue;

            string? version = ReadDeclaredVersion(tag.Split('-')[0]);
            if (version == null) continue;

            runtimes.Add(new Runtime { ProjectId = projectId, Name = runtimeName, Version = version });
        }
    }

    private static string? ReadDeclaredVersion(string declaration)
    {
        Match version = Regex.Match(declaration.Trim(), @"(\d+(?:\.\d+)*)");

        return version.Success ? version.Groups[1].Value : null;
    }
}
