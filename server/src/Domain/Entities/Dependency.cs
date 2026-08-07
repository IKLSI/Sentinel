using Sentinel.Domain.Abstractions.Persistence;
namespace Sentinel.Domain.Entities;

public enum DependencyType
{
    Prod,
    Dev
}

public enum DependencyEcosystem
{
    Npm,
    PyPI,
    Composer,
    Gem,
    Maven,
    Gradle,
    NuGet,
    Go,
    Cargo,
    Hex,
    Pub,
    Swift
}

public enum DependencyStatus
{
    UpToDate,
    MinorUpdate,
    MajorUpdate,
    EOL,
    Vulnerable
}

public class Dependency : IEntityWithId
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string CurrentVersion { get; set; } = string.Empty;
    public string? LatestVersion { get; set; }
    public string? Publisher { get; set; }
    public string? License { get; set; }
    public DependencyType Type { get; set; } = DependencyType.Prod;
    public DependencyEcosystem Ecosystem { get; set; } = DependencyEcosystem.Npm;
    public DependencyStatus Status { get; set; } = DependencyStatus.UpToDate;

    public Project Project { get; set; } = null!;
    public ICollection<Vulnerability> Vulnerabilities { get; set; } = new List<Vulnerability>();
}
