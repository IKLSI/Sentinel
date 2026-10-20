using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Abstractions;

public sealed record RegistryPackageQuery(DependencyEcosystem Ecosystem, string Name);

public sealed record RegistryPackageMetadata(string? LatestVersion, string? Publisher, string? License,
    bool IsDeprecated);

public interface IDependencyRegistryClient
{
    Task<IReadOnlyDictionary<RegistryPackageQuery, RegistryPackageMetadata>> GetMetadataAsync(
        IReadOnlyCollection<RegistryPackageQuery> packages, CancellationToken cancellationToken);
}
