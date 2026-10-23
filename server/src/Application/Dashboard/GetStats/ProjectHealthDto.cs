using Sentinel.Domain.Entities;
using Sentinel.Application.Common.Contracts;
namespace Sentinel.Application.Dashboard.GetStats;

public class ProjectHealthDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    [EnumValues(typeof(RepositoryType))]
    public string RepositoryType { get; set; } = string.Empty;
    public DateTime? LastScanAt { get; set; }
    public bool HasScanError { get; set; }
    [EnumValues(typeof(ScanCoverage))]
    public string Coverage { get; set; } = string.Empty;
    public int? Score { get; set; }
    public string? Grade { get; set; }
    public int? ScoreDelta { get; set; }
    public ScoreBreakdownDto? Breakdown { get; set; }
    public NextActionDto? NextAction { get; set; }
}
