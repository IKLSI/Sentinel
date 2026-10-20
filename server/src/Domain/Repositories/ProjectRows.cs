using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Repositories;

public sealed record ProjectSummaryRow(
    Guid Id,
    string Name,
    string? RepositoryUrl,
    string? Branch,
    string? RootPath,
    RepositoryType RepositoryType,
    DateTime? LastScanAt,
    string? LastScanError,
    int? HealthScore,
    string? HealthGrade,
    ScanCoverage Coverage,
    ScanFrequency ScanFrequency,
    int TotalDependencies,
    int CriticalVulnerabilities,
    int TotalVulnerabilities,
    int KnownExploitedVulnerabilities,
    int TotalTickets);

public sealed record ProjectOptionRow(Guid Id, string Name);
