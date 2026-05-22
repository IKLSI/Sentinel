namespace Sentinel.Domain.DTOs.TechHealth;

public class TechProjectDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? RepositoryUrl { get; set; }
    public string RepositoryType { get; set; } = string.Empty;
    public DateTime? LastScanAt { get; set; }
    public int HealthScore { get; set; }
    public string HealthGrade { get; set; } = string.Empty;
    public string ScanFrequency { get; set; } = string.Empty;
    public int TotalDependencies { get; set; }
    public int VulnerableDependencies { get; set; }
    public int CriticalVulnerabilities { get; set; }
    public int TotalVulnerabilities { get; set; }
    public int TotalTickets { get; set; }
    public List<DependencyDto> Dependencies { get; set; } = new();
    public List<RuntimeDto> Runtimes { get; set; } = new();
}

public class DependencyDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string CurrentVersion { get; set; } = string.Empty;
    public string? LatestVersion { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Ecosystem { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime ScannedAt { get; set; }
    public List<VulnerabilityDto> Vulnerabilities { get; set; } = new();
}

public class VulnerabilityDto
{
    public Guid Id { get; set; }
    public string CveId { get; set; } = string.Empty;
    public decimal CvssScore { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string? FixedVersion { get; set; }
    public string? AdvisoryUrl { get; set; }
    public DateTime DetectedAt { get; set; }
}

public class RuntimeDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public DateTime? EolDate { get; set; }
    public bool IsEol { get; set; }
}

public class CreateTechProjectDto
{
    public string Name { get; set; } = string.Empty;
    public string? RepositoryUrl { get; set; }
    public string RepositoryType { get; set; } = "GitHub";
    public string ScanFrequency { get; set; } = "Weekly";
}

public class UpdateTechProjectDto
{
    public string? Name { get; set; }
    public string? RepositoryUrl { get; set; }
    public string? RepositoryType { get; set; }
    public string? ScanFrequency { get; set; }
}

public class AvailableRepoDto
{
    public string Name { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string Platform { get; set; } = string.Empty;
}
