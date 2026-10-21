using Sentinel.Domain.Entities;

namespace Sentinel.Domain.TechHealth;

public sealed record HealthScoreLedger(
    int RawScore,
    int Score,
    string Grade,
    double TotalPenalty,
    int? Ceiling,
    string? CeilingReason,
    IReadOnlyList<ScorePenaltyLine> Lines);

public sealed record ScorePenaltyLine(
    string Kind,
    IReadOnlyList<string> Modifiers,
    double? Multiplier,
    int Count,
    double Points,
    IReadOnlyList<string> Identifiers,
    IReadOnlyList<string> Packages,
    Runtime? Runtime,
    int? Outdated,
    int? TotalDirect);

public static class ScorePenaltyModifiers
{
    public const string ActivelyExploited = "actively_exploited";
    public const string LikelyExploited = "likely_exploited";
    public const string DevDependency = "dev_dependency";
}

public static class ScoreCeilingReasons
{
    public const string ActivelyExploited = "actively_exploited";
    public const string CriticalInProduction = "critical_in_production";
}
