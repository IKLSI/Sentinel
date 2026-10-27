using System.Text.RegularExpressions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Versioning;

namespace Sentinel.Application.Scanning.Parsers;

internal static partial class ManifestEntries
{
    public static HashSet<string> FileNameSet(params string[] fileNames) =>
        new(fileNames, StringComparer.OrdinalIgnoreCase);

    public static Dependency NewDependency(Guid projectId, string name, string version,
        DependencyEcosystem ecosystem, DependencyType type = DependencyType.Prod) => new()
    {
        ProjectId = projectId,
        Name = name,
        CurrentVersion = version,
        Type = type,
        Ecosystem = ecosystem,
    };

    public static Runtime NewRuntime(Guid projectId, string name, string version, bool isMinimumConstraint = false) => new()
    {
        ProjectId = projectId,
        Name = name,
        Version = version,
        IsMinimumConstraint = isMinimumConstraint
    };

    public static Runtime ConstrainedRuntime(Guid projectId, string name, string version, string specification) =>
        NewRuntime(projectId, name, version, !VersionText.IsExact(specification));

    public static string? ReadDeclaredVersion(string declaration)
    {
        Match version = NumericVersionRegex().Match(declaration.Trim());

        return version.Success ? version.Groups[1].Value : null;
    }

    [GeneratedRegex(@"(\d+(?:\.\d+)*)")]
    private static partial Regex NumericVersionRegex();
}
