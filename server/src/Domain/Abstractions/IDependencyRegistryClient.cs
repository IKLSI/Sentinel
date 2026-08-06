using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Abstractions;

public interface IDependencyRegistryClient
{
    Task FetchLatestVersionsAsync(List<Dependency> dependencies);
}
