using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Repositories;

public sealed record PackageMetadataRow(
    DependencyEcosystem Ecosystem,
    string Name,
    string? LatestVersion,
    string? Publisher,
    string? License,
    bool IsDeprecated);

public sealed record RuntimeLifecycleRow(string Name, string Version, bool? IsEol, DateTime? EolDate);
