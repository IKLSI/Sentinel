using Sentinel.Domain.Entities;
using Sentinel.Application.Common.Contracts;
namespace Sentinel.Application.TechHealth.Projects;

public class ProjectSummaryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? RepositoryUrl { get; set; }
    public string? Branch { get; set; }
    public string? RootPath { get; set; }
    [EnumValues(typeof(RepositoryType))]
    public string RepositoryType { get; set; } = string.Empty;
    public DateTime? LastScanAt { get; set; }
    public string? LastScanError { get; set; }
    public int? HealthScore { get; set; }
    public string? HealthGrade { get; set; }
    [EnumValues(typeof(ScanCoverage))]
    public string Coverage { get; set; } = string.Empty;
    [EnumValues(typeof(ScanFrequency))]
    public string ScanFrequency { get; set; } = string.Empty;
    public int TotalDependencies { get; set; }
    public int CriticalVulnerabilities { get; set; }
    public int TotalVulnerabilities { get; set; }
    public int KnownExploitedVulnerabilities { get; set; }
    public int TotalTickets { get; set; }
}
