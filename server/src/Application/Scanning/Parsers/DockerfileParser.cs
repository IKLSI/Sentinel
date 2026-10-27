using System.Text.RegularExpressions;
using static Sentinel.Application.Scanning.Parsers.ManifestEntries;

namespace Sentinel.Application.Scanning.Parsers;

internal sealed partial class DockerfileParser : IManifestFileParser
{
    private static readonly Dictionary<string, string> BaseImageRuntimes = new(StringComparer.OrdinalIgnoreCase)
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

    private static readonly Dictionary<string, string> OperatingSystemImages = new(StringComparer.OrdinalIgnoreCase)
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

    public bool CanParse(string fileName) => fileName.Equals("Dockerfile", StringComparison.OrdinalIgnoreCase);

    public void Parse(ManifestDocument manifest, ManifestParseResult result)
    {
        foreach (Match from in FromRegex().Matches(manifest.Content))
        {
            if (SplitImageReference(from.Groups[1].Value) is not (string image, string tag)) continue;

            if (DetectBaseOperatingSystem(image, tag) is (string osName, string osVersion))
                result.Runtimes.Add(NewRuntime(manifest.ProjectId, osName, osVersion));

            if (tag.Length == 0 || !char.IsDigit(tag[0])) continue;
            if (!BaseImageRuntimes.TryGetValue(image, out string? runtimeName)) continue;

            string? version = ReadDeclaredVersion(tag.Split('-')[0]);
            if (version == null) continue;

            result.Runtimes.Add(NewRuntime(manifest.ProjectId, runtimeName, version));
        }
    }

    private static (string Image, string Tag)? SplitImageReference(string imageReference)
    {
        string reference = RegistryPrefixRegex().Replace(imageReference, string.Empty);

        int digest = reference.IndexOf('@');
        if (digest >= 0) reference = reference[..digest];

        int tagSeparator = reference.LastIndexOf(':');
        if (tagSeparator <= 0) return null;

        return (reference[..tagSeparator], reference[(tagSeparator + 1)..]);
    }

    private static (string Name, string Version)? DetectBaseOperatingSystem(string image, string tag)
    {
        if (OperatingSystemImages.TryGetValue(image, out string? operatingSystem))
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

    [GeneratedRegex(@"^\s*FROM\s+(?:--\S+\s+)*(\S+)", RegexOptions.Multiline | RegexOptions.IgnoreCase)]
    private static partial Regex FromRegex();

    [GeneratedRegex(@"^(?:(?:index\.)?docker\.io/)?(?:library/)?", RegexOptions.IgnoreCase)]
    private static partial Regex RegistryPrefixRegex();

    [GeneratedRegex(@"^alpine(\d+\.\d+)$", RegexOptions.IgnoreCase)]
    private static partial Regex AlpineTagRegex();
}
