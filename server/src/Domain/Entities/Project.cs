using Sentinel.Domain.Abstractions.Persistence;
namespace Sentinel.Domain.Entities;

public enum RepositoryType
{
    GitHub,
    GitLab
}

public enum ScanFrequency
{
    Daily,
    Weekly,
    Monthly,
    Manual
}

public enum ScanCoverage
{
    NotScanned,
    Failed,
    NoManifest,
    NoDependencies,
    Covered
}

public class Project : IEntityWithId
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid OrganizationId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? RepositoryUrl { get; set; }
    public string? Branch { get; set; }
    public string? RootPath { get; set; }
    public string? BadgeToken { get; set; }
    public RepositoryType RepositoryType { get; set; } = RepositoryType.GitHub;
    public DateTime? LastScanAt { get; set; }
    public string? LastScanError { get; set; }
    public string? LastScanErrorDetail { get; set; }
    public DateTime? LastReliableScanAt { get; set; }
    public string? LastScannedCommitSha { get; set; }
    public int? HealthScore { get; set; }
    public string? HealthGrade { get; set; }
    public ScanCoverage Coverage { get; set; } = ScanCoverage.NotScanned;
    public ScanFrequency ScanFrequency { get; set; } = ScanFrequency.Weekly;

    public Organization Organization { get; set; } = null!;
    public ICollection<Dependency> Dependencies { get; set; } = new List<Dependency>();
    public ICollection<Runtime> Runtimes { get; set; } = new List<Runtime>();
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
