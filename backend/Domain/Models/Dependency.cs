namespace Sentinel.Domain.Models;

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
    Cargo
}

public enum DependencyStatus
{
    UpToDate,
    MinorUpdate,
    MajorUpdate,
    EOL,
    Vulnerable
}

public class Dependency
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string CurrentVersion { get; set; } = string.Empty;
    public string? LatestVersion { get; set; }
    public DependencyType Type { get; set; } = DependencyType.Prod;
    public DependencyEcosystem Ecosystem { get; set; } = DependencyEcosystem.Npm;
    public DependencyStatus Status { get; set; } = DependencyStatus.UpToDate;
    public DateTime ScannedAt { get; set; } = DateTime.UtcNow;

    public Project Project { get; set; } = null!;
    public ICollection<Vulnerability> Vulnerabilities { get; set; } = new List<Vulnerability>();
}
