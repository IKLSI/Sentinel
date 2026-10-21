namespace Sentinel.Domain.TechHealth;

public sealed record GradeThreshold(string Grade, int MinScore);

public sealed record ScorePenalty(string Kind, int Points);

public static class ScorePenaltyKinds
{
    public const string CriticalVulnerability = "critical_vulnerability";
    public const string EolRuntime = "eol_runtime";
    public const string HighVulnerability = "high_vulnerability";
    public const string EolDependency = "eol_dependency";
    public const string MediumVulnerability = "medium_vulnerability";
    public const string LowVulnerability = "low_vulnerability";
    public const string MajorVersionLag = "major_version_lag";
    public const string MinorVersionLag = "minor_version_lag";
}
