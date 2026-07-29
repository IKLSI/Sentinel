using Sentinel.Domain.Models;

namespace Sentinel.Domain.Abstractions;

public interface IDependencyRegistryClient
{
    Task FetchLatestVersionsAsync(List<Dependency> dependencies);
}
