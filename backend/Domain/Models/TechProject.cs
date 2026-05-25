namespace Sentinel.Domain.Models;

public enum RepositoryType
{
    GitHub,
    GitLab
}

public enum ScanFrequency
{
    Daily,
    Weekly
}

public class TechProject
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? RepositoryUrl { get; set; }
    public RepositoryType RepositoryType { get; set; } = RepositoryType.GitHub;
    public DateTime? LastScanAt { get; set; }
    public string? LastScanError { get; set; }
    public int HealthScore { get; set; } = 100;
    public string HealthGrade { get; set; } = "A";
    public ScanFrequency ScanFrequency { get; set; } = ScanFrequency.Weekly;

    public Organization Organization { get; set; } = null!;
    public ICollection<Dependency> Dependencies { get; set; } = new List<Dependency>();
    public ICollection<Runtime> Runtimes { get; set; } = new List<Runtime>();
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
