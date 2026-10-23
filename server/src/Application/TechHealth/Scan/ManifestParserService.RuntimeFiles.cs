using System.Text.Json;
using System.Text.RegularExpressions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Versioning;

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

    private static readonly Dictionary<string, string> DockerOperatingSystemImages = new(StringComparer.OrdinalIgnoreCase)
    {
        ["alpine"] = "Alpine Linux",
        ["debian"] = "Debian",
        ["ubuntu"] = "Ubuntu",
        ["centos"] = "CentOS",
        ["rockylinux"] = "Rocky Linux",
        ["rockylinux/rockylinux"] = "Rocky Linux",
        ["almalinux"] = "AlmaLinux",
        ["amazonlinux"] = "Amazon Linux",
        ["fedora"] = "Fedora",
    };

    private static readonly Dictionary<string, string> DebianCodenames = new(StringComparer.OrdinalIgnoreCase)
    {
        ["stretch"] = "9",
        ["buster"] = "10",
        ["bullseye"] = "11",
        ["bookworm"] = "12",
        ["trixie"] = "13",
    };

    private static readonly Dictionary<string, string> UbuntuCodenames = new(StringComparer.OrdinalIgnoreCase)
    {
        ["bionic"] = "18.04",
        ["focal"] = "20.04",
        ["jammy"] = "22.04",
        ["lunar"] = "23.04",
        ["mantic"] = "23.10",
        ["noble"] = "24.04",
        ["oracular"] = "24.10",
        ["plucky"] = "25.04",
        ["questing"] = "25.10",
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
        using JsonDocument doc = JsonDocument.Parse(content);

        if (!doc.RootElement.TryGetProperty("sdk", out JsonElement sdk)) return;
        if (!sdk.TryGetProperty("version", out JsonElement versionProperty)) return;

        string? version = ReadDeclaredVersion(versionProperty.GetString() ?? string.Empty);
        if (version == null) return;

        string[] segments = version.Split('.');
        string runtimeVersion = segments.Length >= 2 ? $"{segments[0]}.{segments[1]}" : segments[0];

        runtimes.Add(new Runtime { ProjectId = projectId, Name = ".NET", Version = runtimeVersion });
    }

    private static void ParseGoWork(Guid projectId, string content, List<Runtime> runtimes)
    {
        Match goVersion = GoDirectiveRegex().Match(content);

        if (goVersion.Success)
            runtimes.Add(new Runtime { ProjectId = projectId, Name = "Go", Version = goVersion.Groups[1].Value });
    }

    private static readonly Dictionary<string, string> RuntimeTxtPlatforms = new(StringComparer.OrdinalIgnoreCase)
    {
        ["python"] = "Python",
        ["ruby"] = "Ruby",
        ["nodejs"] = "Node.js",
        ["node"] = "Node.js",
        ["php"] = "PHP",
        ["dotnet"] = ".NET",
    };

    private static void ParseRuntimeTxt(Guid projectId, string content, List<Runtime> runtimes)
    {
        Match declaration = ToolVersionDeclarationRegex().Match(content.Trim());
        if (!declaration.Success) return;

        if (!RuntimeTxtPlatforms.TryGetValue(declaration.Groups[1].Value, out string? runtimeName)) return;

        runtimes.Add(new Runtime
        {
            ProjectId = projectId,
            Name = runtimeName,
            Version = declaration.Groups[2].Value.TrimEnd('.')
        });
    }

    private static void ParseRustToolchain(Guid projectId, string content, List<Runtime> runtimes)
    {
        Match channel = RustToolchainChannelRegex().Match(content);
        string declared = channel.Success ? channel.Groups[1].Value : content.Trim();

        string? version = ReadDeclaredVersion(declared);
        if (version == null) return;

        runtimes.Add(new Runtime { ProjectId = projectId, Name = "Rust", Version = version });
    }

    private static void ParseDockerfile(Guid projectId, string content, List<Runtime> runtimes)
    {
        foreach (Match from in DockerFromRegex().Matches(content))
        {
            string reference = DockerRegistryPrefixRegex().Replace(from.Groups[1].Value, string.Empty);

            int digest = reference.IndexOf('@');
            if (digest >= 0) reference = reference[..digest];

            int tagSeparator = reference.LastIndexOf(':');
            if (tagSeparator <= 0) continue;

            string image = reference[..tagSeparator];
            string tag = reference[(tagSeparator + 1)..];

            if (DetectBaseOperatingSystem(image, tag) is (string osName, string osVersion))
                runtimes.Add(new Runtime { ProjectId = projectId, Name = osName, Version = osVersion });

            if (tag.Length == 0 || !char.IsDigit(tag[0])) continue;
            if (!DockerBaseImageRuntimes.TryGetValue(image, out string? runtimeName)) continue;

            string? version = ReadDeclaredVersion(tag.Split('-')[0]);
            if (version == null) continue;

            runtimes.Add(new Runtime { ProjectId = projectId, Name = runtimeName, Version = version });
        }
    }

    [GeneratedRegex(@"^(?:(?:index\.)?docker\.io/)?(?:library/)?", RegexOptions.IgnoreCase)]
    private static partial Regex DockerRegistryPrefixRegex();

    private static (string Name, string Version)? DetectBaseOperatingSystem(string image, string tag)
    {
        if (DockerOperatingSystemImages.TryGetValue(image, out string? operatingSystem))
        {
            string release = tag.Split('-')[0];
            string? version = operatingSystem switch
            {
                "Debian" when DebianCodenames.TryGetValue(release, out string? debian) => debian,
                "Ubuntu" when UbuntuCodenames.TryGetValue(release, out string? ubuntu) => ubuntu,
                _ => char.IsDigit(release.FirstOrDefault()) ? ReadDeclaredVersion(release) : null
            };

            return version == null ? null : (operatingSystem, version);
        }

        foreach (string part in tag.Split('-'))
        {
            Match alpine = AlpineTagRegex().Match(part);
            if (alpine.Success) return ("Alpine Linux", alpine.Groups[1].Value);

            if (DebianCodenames.TryGetValue(part, out string? debianVersion)) return ("Debian", debianVersion);
            if (UbuntuCodenames.TryGetValue(part, out string? ubuntuVersion)) return ("Ubuntu", ubuntuVersion);
        }

        return null;
    }

    private static void ParseGradleWrapperProperties(Guid projectId, string content, List<Runtime> runtimes)
    {
        Match distribution = GradleDistributionRegex().Match(content);

        if (distribution.Success)
            runtimes.Add(new Runtime { ProjectId = projectId, Name = "Gradle", Version = distribution.Groups[1].Value });
    }

    private static void AddDependencyDerivedRuntimes(Guid projectId, List<Dependency> deps, List<Runtime> runtimes)
    {
        foreach (Dependency dependency in deps)
        {
            if (!DependencyRuntimes.TryGetValue((dependency.Ecosystem, dependency.Name), out string? runtimeName))
                continue;
            if (!VersionText.StartsWithDigit(dependency.CurrentVersion)) continue;
            if (runtimes.Any(runtime => runtime.Name == runtimeName)) continue;

            runtimes.Add(new Runtime
            {
                ProjectId = projectId,
                Name = runtimeName,
                Version = dependency.CurrentVersion,
                IsMinimumConstraint = !dependency.IsVersionPinned
            });
        }
    }

    private static readonly Dictionary<(DependencyEcosystem, string), string> DependencyRuntimes = new()
    {
        [(DependencyEcosystem.Maven, "org.springframework:spring-core")] = "Spring Framework",
        [(DependencyEcosystem.Maven, "org.springframework:spring-context")] = "Spring Framework",
        [(DependencyEcosystem.Maven, "io.quarkus:quarkus-core")] = "Quarkus",
        [(DependencyEcosystem.Maven, "io.quarkus.platform:quarkus-bom")] = "Quarkus",
        [(DependencyEcosystem.Hex, "phoenix")] = "Phoenix",
    };

    [GeneratedRegex(@"^alpine(\d+\.\d+)$", RegexOptions.IgnoreCase)]
    private static partial Regex AlpineTagRegex();

    [GeneratedRegex(@"distributionUrl=.*gradle-(\d+(?:\.\d+)*)-(?:bin|all)\.zip")]
    private static partial Regex GradleDistributionRegex();

    private static string? ReadDeclaredVersion(string declaration)
    {
        Match version = NumericVersionRegex().Match(declaration.Trim());

        return version.Success ? version.Groups[1].Value : null;
    }

    [GeneratedRegex(@"^go\s+([\d.]+)", RegexOptions.Multiline)]
    private static partial Regex GoDirectiveRegex();

    [GeneratedRegex(@"^([a-zA-Z.\-]+)-v?([\d.]+)")]
    private static partial Regex ToolVersionDeclarationRegex();

    [GeneratedRegex(@"channel\s*=\s*[""']([^""']+)[""']")]
    private static partial Regex RustToolchainChannelRegex();

    [GeneratedRegex(@"^\s*FROM\s+(?:--\S+\s+)*(\S+)", RegexOptions.Multiline | RegexOptions.IgnoreCase)]
    private static partial Regex DockerFromRegex();

    [GeneratedRegex(@"(\d+(?:\.\d+)*)")]
    private static partial Regex NumericVersionRegex();
}
