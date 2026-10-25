using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Repositories;

public sealed record UrgentTicketRow(
    Guid Id,
    int Number,
    string Title,
    string Priority,
    string Type,
    string? ProjectName,
    string? AssignedToName,
    int CommentCount);

public sealed record ClosedTicketActivityRow(
    Guid Id,
    int Number,
    DateTime UpdatedAt,
    Guid? ProjectId,
    string? ProjectName,
    string? AssigneeFirstName,
    string? AssigneeLastName,
    string? CreatedByFirstName,
    string? CreatedByLastName);

public sealed record CreatedTicketActivityRow(
    Guid Id,
    int Number,
    DateTime CreatedAt,
    Guid? ProjectId,
    string? ProjectName,
    string? CreatedByFirstName,
    string? CreatedByLastName);

public sealed record VulnerabilityActivityRow(
    DateTime DetectedAt,
    string CveId,
    decimal CvssScore,
    string ProjectName,
    Guid ProjectId);

public sealed record ScoreSnapshotRow(
    Guid ProjectId,
    DateOnly Day,
    int Score);

public sealed record DashboardProjectRow(
    Guid Id,
    string Name,
    RepositoryType RepositoryType,
    DateTime? LastScanAt,
    ScanCoverage Coverage,
    string? LastScanError,
    int? HealthScore,
    string? HealthGrade);

public sealed record DashboardRuntimeRow(
    Guid ProjectId,
    string Name,
    string Version,
    DateTime? EolDate,
    bool? IsEol,
    bool IsMinimumConstraint);

public sealed record VulnerabilityTotalsRow(
    int Total,
    int Critical,
    int High,
    int Medium,
    int Low,
    int KnownExploited)
{
    public static readonly VulnerabilityTotalsRow Empty = new(0, 0, 0, 0, 0, 0);
}

public sealed record DependencyTotalsRow(
    int Total,
    int UpToDate,
    int MinorUpdate,
    int MajorUpdate,
    int Deprecated,
    int Vulnerable,
    int MajorUpdatesInProduction)
{
    public static readonly DependencyTotalsRow Empty = new(0, 0, 0, 0, 0, 0, 0);
}

public sealed record OpenTicketRow(
    Guid Id,
    int Number,
    Guid? ProjectId,
    TicketPriority Priority,
    bool IsAssigned,
    DateTime CreatedAt);

public sealed record VulnerabilityFlowCountsRow(
    IReadOnlyDictionary<DateTime, int> Opened,
    IReadOnlyDictionary<DateTime, int> ResolvedDetections,
    IReadOnlyDictionary<DateTime, int> Resolutions);
