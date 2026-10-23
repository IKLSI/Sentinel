using Sentinel.Application.TechHealth.Remediation;
using Sentinel.Application.TechHealth.Suppressions;

namespace Sentinel.Application.TechHealth;

public class ProjectDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? RepositoryUrl { get; set; }
    public string? Branch { get; set; }
    public string? RootPath { get; set; }
    public string RepositoryType { get; set; } = string.Empty;
    public DateTime? LastScanAt { get; set; }
    public string? LastScanError { get; set; }
    public int? HealthScore { get; set; }
    public string? HealthGrade { get; set; }
    public string Coverage { get; set; } = string.Empty;
    public string ScanFrequency { get; set; } = string.Empty;
    public int TotalDependencies { get; set; }
    public int CriticalVulnerabilities { get; set; }
    public int TotalVulnerabilities { get; set; }
    public int KnownExploitedVulnerabilities { get; set; }
    public int TotalTickets { get; set; }
    public bool RemediationAvailable { get; set; }
    public int RemediableVulnerabilities { get; set; }
    public bool RemediationIncludesMajorUpgrade { get; set; }
    public RemediationDto? Remediation { get; set; }
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
    public bool IsDirect { get; set; }
    public string Ecosystem { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public bool IsOutdated { get; set; }
    public bool IsVersionPinned { get; set; }
    public string? ManifestPath { get; set; }
    public string FindingKey { get; set; } = string.Empty;
    public FindingTicketDto? LinkedTicket { get; set; }
    public List<VulnerabilityDto> Vulnerabilities { get; set; } = new();
}

public class VulnerabilityDto
{
    public Guid Id { get; set; }
    public string CveId { get; set; } = string.Empty;
    public string? CveAlias { get; set; }
    public decimal CvssScore { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string? FixedVersion { get; set; }
    public decimal? EpssScore { get; set; }
    public decimal? EpssPercentile { get; set; }
    public bool IsKnownExploited { get; set; }
    public bool IsMaliciousPackage { get; set; }
    public string Priority { get; set; } = string.Empty;
    public string FindingKey { get; set; } = string.Empty;
    public FindingTicketDto? LinkedTicket { get; set; }
    public SuppressionDto? Suppression { get; set; }
}

public class RuntimeDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public List<string> Versions { get; set; } = [];
    public DateTime? EolDate { get; set; }
    public bool? IsEol { get; set; }
    public bool IsMinimumConstraint { get; set; }
    public string EolStatus { get; set; } = string.Empty;
    public int? DaysRemaining { get; set; }
    public int EolProgressPercent { get; set; }
    public string FindingKey { get; set; } = string.Empty;
    public FindingTicketDto? LinkedTicket { get; set; }
}

public class FindingTicketDto
{
    public Guid Id { get; set; }
    public string Reference { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}
