using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Abstractions;

public interface IDependencyRegistryClient
{
    Task FetchRegistryMetadataAsync(List<Dependency> dependencies);
}
