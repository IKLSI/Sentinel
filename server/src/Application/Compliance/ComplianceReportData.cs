using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Compliance;

internal enum ComplianceControlStatus
{
    Covered,
    Partial,
    Attention
}

internal sealed record ComplianceControl(string Requirement, string Framework, ComplianceControlStatus Status,
    string Detail);

internal sealed class ComplianceReportData
{
    public required ComplianceReportLabels Labels { get; init; }
    public string ProjectName { get; init; } = string.Empty;
    public string OrganizationName { get; init; } = string.Empty;
    public string? RepositoryUrl { get; init; }
    public DateTime GeneratedAt { get; init; }
    public DateTime? LastScanAt { get; init; }
    public int? HealthScore { get; init; }
    public string? HealthGrade { get; init; }
    public int TotalDependencies { get; init; }
    public int CriticalCount { get; init; }
    public int HighCount { get; init; }
    public int TotalVulnerabilities { get; init; }
    public int EolRuntimeCount { get; init; }
    public List<Vulnerability> Vulnerabilities { get; init; } = new();
    public bool VulnerabilitiesTruncated { get; init; }
    public List<Runtime> EolRuntimes { get; init; } = new();
    public List<ComplianceAuditLogRow> AuditTrail { get; init; } = new();
    public bool AuditTrailTruncated { get; init; }
    public Guid ReportId { get; init; }
    public string ReportFingerprint { get; init; } = string.Empty;
    public string? GeneratedByName { get; init; }
    public string? GeneratedByEmail { get; init; }
    public List<ComplianceControl> Controls { get; init; } = new();
}
