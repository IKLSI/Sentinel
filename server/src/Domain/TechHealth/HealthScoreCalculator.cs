using Sentinel.Domain.Entities;
using Sentinel.Domain.Versioning;

namespace Sentinel.Domain.TechHealth;

public static class HealthScoreCalculator
{
    private const double DevDependencyWeight = 0.25;
    private const int MaxOutdatedPenalty = 40;
    private const int MajorUpdateWeight = 2;
    private const int MinorUpdateWeight = 1;
    private const int CriticalPenalty = 15;
    private const int HighPenalty = 10;
    private const int MediumPenalty = 5;
    private const int LowPenalty = 2;
    private const int EolDependencyPenalty = 10;
    private const int EolRuntimePenalty = 15;
    private const int ApproachingEolRuntimePenalty = 5;
    public const int ScoreDecayConstant = 150;
    public const int MaxScore = 100;
    private const int CriticalVulnerabilityCeiling = 74;
    private const int ActivelyThreatenedCeiling = 59;

    public static IReadOnlyList<GradeThreshold> GradeThresholds { get; } =
    [
        new("A", 90),
        new("B", 75),
        new("C", 60),
        new("D", 45),
        new("E", 30),
        new("F", 0),
    ];

    public static IReadOnlyList<ScorePenalty> Penalties { get; } =
    [
        new(ScorePenaltyKinds.CriticalVulnerability, CriticalPenalty),
        new(ScorePenaltyKinds.EolRuntime, EolRuntimePenalty),
        new(ScorePenaltyKinds.HighVulnerability, HighPenalty),
        new(ScorePenaltyKinds.EolDependency, EolDependencyPenalty),
        new(ScorePenaltyKinds.MediumVulnerability, MediumPenalty),
        new(ScorePenaltyKinds.LowVulnerability, LowPenalty),
        new(ScorePenaltyKinds.MajorVersionLag, MajorUpdateWeight),
        new(ScorePenaltyKinds.MinorVersionLag, MinorUpdateWeight),
    ];

    public static int Calculate(Project project) => Calculate(project, _ => false);

    public static int Calculate(Project project, Func<Vulnerability, bool> isResolved) =>
        Itemize(project, isResolved, DateTime.UtcNow).Score;

    public static HealthScoreLedger Itemize(Project project, DateTime now) => Itemize(project, _ => false, now);

    public static HealthScoreLedger Itemize(Project project, Func<Vulnerability, bool> isResolved, DateTime now)
    {
        List<PenaltyCharge> charges = Charges(project, isResolved, now);
        double penalty = charges.Sum(charge => charge.Points);

        int rawScore = ToScore(penalty);
        (int? ceiling, string? ceilingReason) = ScoreCeiling(project, isResolved);
        int score = Math.Min(rawScore, ceiling ?? MaxScore);

        return new HealthScoreLedger(rawScore, score, ToGrade(score), penalty, ceiling, ceilingReason,
            ToLines(charges));
    }

    private static (int? Ceiling, string? Reason) ScoreCeiling(Project project, Func<Vulnerability, bool> isResolved)
    {
        List<Vulnerability> openProductionVulnerabilities = project.Dependencies
            .Where(dependency => dependency.Type == DependencyType.Prod)
            .SelectMany(dependency => dependency.Vulnerabilities)
            .Where(vulnerability => !isResolved(vulnerability))
            .ToList();

        if (openProductionVulnerabilities.Any(VulnerabilityRiskCalculator.IsActivelyThreatened))
            return (ActivelyThreatenedCeiling, ScoreCeilingReasons.ActivelyExploited);

        return openProductionVulnerabilities.Any(vulnerability => vulnerability.Severity == VulnerabilitySeverity.Critical)
            ? (CriticalVulnerabilityCeiling, ScoreCeilingReasons.CriticalInProduction)
            : (null, null);
    }

    public static HealthScoreBreakdown Breakdown(Project project) => Breakdown(project, _ => false);

    public static HealthScoreBreakdown Breakdown(Project project, Func<Vulnerability, bool> isResolved)
    {
        ILookup<ScoreArea, double> pointsByArea = Charges(project, isResolved, DateTime.UtcNow)
            .ToLookup(charge => AreaOf(charge.Kind), charge => charge.Points);

        return new HealthScoreBreakdown(
            ToScore(pointsByArea[ScoreArea.Security].Sum()),
            ToScore(pointsByArea[ScoreArea.Runtimes].Sum()),
            ToScore(pointsByArea[ScoreArea.Freshness].Sum()));
    }

    private static List<PenaltyCharge> Charges(Project project, Func<Vulnerability, bool> isResolved, DateTime now)
    {
        List<PenaltyCharge> charges = [];
        double versionLagPenalty = OutdatedPenalty(project);

        if (versionLagPenalty > 0) charges.Add(VersionLagCharge(project, versionLagPenalty));

        foreach (Dependency dependency in project.Dependencies)
        {
            double weight = WeightOf(dependency);

            if (dependency.IsDeprecated) charges.Add(DeprecationCharge(dependency, weight));

            charges.AddRange(OpenVulnerabilities(dependency, isResolved).Select(vulnerability =>
                VulnerabilityCharge(dependency, vulnerability, weight)));
        }

        charges.AddRange(RuntimeCharges(project, now));

        return charges;
    }

    private static ScoreArea AreaOf(string kind) => kind switch
    {
        ScorePenaltyKinds.EolRuntime or ScorePenaltyKinds.ApproachingEolRuntime => ScoreArea.Runtimes,
        ScorePenaltyKinds.VersionLag or ScorePenaltyKinds.EolDependency => ScoreArea.Freshness,
        _ => ScoreArea.Security
    };

    private enum ScoreArea
    {
        Security,
        Runtimes,
        Freshness
    }

    public static string ToGrade(int score) =>
        GradeThresholds.FirstOrDefault(threshold => score >= threshold.MinScore)?.Grade ?? GradeThresholds[^1].Grade;

    private static List<Vulnerability> OpenVulnerabilities(Dependency dependency,
        Func<Vulnerability, bool> isResolved) =>
        dependency.Vulnerabilities.Where(vulnerability => !isResolved(vulnerability)).ToList();

    private static double VulnerabilityPenalty(Vulnerability vulnerability) =>
        SeverityPenalty(vulnerability.Severity) * VulnerabilityRiskCalculator.PenaltyMultiplier(vulnerability);

    private static List<PenaltyCharge> RuntimeCharges(Project project, DateTime now) =>
        RuntimeGrouping.ByName(project.Runtimes)
            .Select(group => RuntimeCharge(group, now))
            .OfType<PenaltyCharge>()
            .ToList();

    private static PenaltyCharge? RuntimeCharge(RuntimeGroup group, DateTime now)
    {
        if (FindingRules.IsEol(group))
            return new PenaltyCharge(ScorePenaltyKinds.EolRuntime, [], 1, EolRuntimePenalty, null, null,
                group.MostAtRisk);

        return FindingRules.IsApproachingEol(group.MostAtRisk, now)
            ? new PenaltyCharge(ScorePenaltyKinds.ApproachingEolRuntime, [], 1, ApproachingEolRuntimePenalty, null,
                null, group.MostAtRisk)
            : null;
    }

    private static PenaltyCharge VersionLagCharge(Project project, double penalty)
    {
        List<Dependency> directDependencies = DirectDependencies(project);

        return new PenaltyCharge(ScorePenaltyKinds.VersionLag, [], 1, penalty, null, null, null)
        {
            Outdated = directDependencies.Count(dependency => UpdateWeight(dependency) > 0),
            TotalDirect = directDependencies.Count
        };
    }

    private static PenaltyCharge DeprecationCharge(Dependency dependency, double weight) =>
        new(ScorePenaltyKinds.EolDependency, DependencyModifiers(dependency), weight, EolDependencyPenalty * weight,
            null, dependency.Name, null);

    private static PenaltyCharge VulnerabilityCharge(Dependency dependency, Vulnerability vulnerability, double weight)
    {
        List<string> modifiers = [];

        if (VulnerabilityRiskCalculator.IsActivelyThreatened(vulnerability))
            modifiers.Add(ScorePenaltyModifiers.ActivelyExploited);
        else if (VulnerabilityRiskCalculator.IsLikelyExploited(vulnerability))
            modifiers.Add(ScorePenaltyModifiers.LikelyExploited);

        modifiers.AddRange(DependencyModifiers(dependency));

        return new PenaltyCharge(SeverityKind(vulnerability.Severity), modifiers,
            VulnerabilityRiskCalculator.PenaltyMultiplier(vulnerability) * weight,
            VulnerabilityPenalty(vulnerability) * weight, vulnerability.CveAlias, dependency.Name, null);
    }

    private static List<string> DependencyModifiers(Dependency dependency) =>
        dependency.Type == DependencyType.Dev ? [ScorePenaltyModifiers.DevDependency] : [];

    private static List<ScorePenaltyLine> ToLines(List<PenaltyCharge> charges) => charges
        .GroupBy(charge => charge.GroupKey)
        .Select(group =>
        {
            PenaltyCharge first = group.First();

            return new ScorePenaltyLine(
                first.Kind,
                first.Modifiers,
                first.Multiplier == 1 ? null : first.Multiplier,
                group.Count(),
                group.Sum(charge => charge.Points),
                DistinctValues(group.Select(charge => charge.Identifier)),
                DistinctValues(group.Select(charge => charge.Package)),
                first.Runtime,
                first.Outdated,
                first.TotalDirect);
        })
        .OrderByDescending(line => line.Points)
        .ToList();

    private static List<string> DistinctValues(IEnumerable<string?> values) => values
        .OfType<string>()
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .ToList();

    private static string SeverityKind(VulnerabilitySeverity severity) => severity switch
    {
        VulnerabilitySeverity.Critical => ScorePenaltyKinds.CriticalVulnerability,
        VulnerabilitySeverity.High => ScorePenaltyKinds.HighVulnerability,
        VulnerabilitySeverity.Medium => ScorePenaltyKinds.MediumVulnerability,
        _ => ScorePenaltyKinds.LowVulnerability
    };

    private static int ToScore(double penalty) => (int)Math.Round(MaxScore * Math.Exp(-penalty / ScoreDecayConstant));

    private static int SeverityPenalty(VulnerabilitySeverity severity) => severity switch
    {
        VulnerabilitySeverity.Critical => CriticalPenalty,
        VulnerabilitySeverity.High => HighPenalty,
        VulnerabilitySeverity.Medium => MediumPenalty,
        VulnerabilitySeverity.Low => LowPenalty,
        _ => 0
    };

    private static double WeightOf(Dependency dependency) =>
        dependency.Type == DependencyType.Dev ? DevDependencyWeight : 1;

    private static List<Dependency> DirectDependencies(Project project) =>
        project.Dependencies.Where(dependency => dependency.IsDirect).ToList();

    private static double OutdatedPenalty(Project project)
    {
        List<Dependency> directDependencies = DirectDependencies(project);

        if (directDependencies.Count == 0) return 0;

        double outdatedWeight = directDependencies
            .Sum(dependency => UpdateWeight(dependency) * WeightOf(dependency));

        double maxWeight = directDependencies.Count * MajorUpdateWeight;

        return outdatedWeight / maxWeight * MaxOutdatedPenalty;
    }

    private static int UpdateWeight(Dependency dependency) =>
        DependencyStatusCalculator.UpdateOf(dependency) switch
        {
            DependencyStatus.MajorUpdate => MajorUpdateWeight,
            DependencyStatus.MinorUpdate => MinorUpdateWeight,
            _ => 0
        };

    private sealed record PenaltyCharge(
        string Kind,
        IReadOnlyList<string> Modifiers,
        double Multiplier,
        double Points,
        string? Identifier,
        string? Package,
        Runtime? Runtime)
    {
        public int? Outdated { get; init; }
        public int? TotalDirect { get; init; }

        public string GroupKey => $"{Kind}|{string.Join(',', Modifiers)}|{Runtime?.Name}";
    }
}
