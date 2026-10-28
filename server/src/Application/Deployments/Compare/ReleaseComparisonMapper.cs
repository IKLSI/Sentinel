using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Entities;

namespace Sentinel.Application.Deployments.Compare;

public sealed record ReleaseMigration(string Path, MigrationAnalysis Analysis);

public sealed record ReleaseComparisonParts(
    ReleaseComparisonModel Model,
    RepositoryComparison Comparison,
    ReleaseSnapshots Snapshots,
    List<DependencyChange> DependencyChanges,
    ReleaseVulnerabilityAssessment Vulnerabilities);

public static class ReleaseComparisonMapper
{
    private const int MaxCommits = 250;

    public static ReleaseComparisonDto ToDto(ReleaseComparisonParts parts)
    {
        List<string> commitTitles = parts.Comparison.Commits
            .OrderByDescending(commit => commit.Date)
            .Select(commit => ReleaseNotes.TitleOf(commit.Message))
            .Where(title => !ReleaseNotes.IsMergeCommit(title))
            .ToList();

        return new ReleaseComparisonDto
        {
            HeadReference = parts.Model.Head!.Trim(),
            Summary = new ReleaseSummaryDto
            {
                FixedVulnerabilityCount = parts.DependencyChanges
                    .Sum(change => parts.Vulnerabilities.Deltas[change].FixedCount),
                HistoryTruncated = parts.Comparison.Truncated || commitTitles.Count > MaxCommits,
                InventoryIncomplete = !parts.Snapshots.Base.Inventory.IsComplete
                    || !parts.Snapshots.Head.Inventory.IsComplete,
                VulnerabilityDataIncomplete = !parts.Vulnerabilities.IsComplete
            },
            Configuration = ConfigurationDiff
                .Compare(parts.Snapshots.Base.Configuration, parts.Snapshots.Head.Configuration)
                .Where(change => change.RequiresValue || change.Change == ReleaseChangeKind.Removed)
                .Select(ToDto)
                .ToList(),
            Migrations = parts.Snapshots.Migrations
                .Where(migration => migration.Analysis.Risk != MigrationRisk.Safe)
                .Select(ToDto)
                .ToList(),
            Runtimes = ReleaseRuntimes
                .Compare(parts.Snapshots.Base.Inventory.Runtimes, parts.Snapshots.Head.Inventory.Runtimes)
                .Select(ToDto)
                .ToList(),
            Dependencies = parts.DependencyChanges
                .Select(change => ToDto(change, parts.Vulnerabilities.Deltas[change]))
                .ToList(),
            Commits = commitTitles.Take(MaxCommits).Select(ToDto).ToList()
        };
    }

    private static ConfigurationChangeDto ToDto(ConfigurationKeyChange change) => new()
    {
        File = change.File,
        Key = change.Key,
        RequiresValue = change.RequiresValue,
        Severity = (change.RequiresValue ? ReleaseItemSeverity.Blocking : ReleaseItemSeverity.Warning).ToString()
    };

    private static MigrationChangeDto ToDto(ReleaseMigration migration) => new()
    {
        Path = migration.Path,
        Name = Path.GetFileNameWithoutExtension(migration.Path),
        Risk = migration.Analysis.Risk.ToString(),
        Operations = migration.Analysis.Operations
            .Select(operation => new MigrationOperationDto { Kind = operation.Kind.ToString(), Target = operation.Target })
            .ToList(),
        Severity = (migration.Analysis.Risk == MigrationRisk.Destructive
            ? ReleaseItemSeverity.Blocking
            : ReleaseItemSeverity.Warning).ToString()
    };

    private static RuntimeChangeDto ToDto(ReleaseRuntimeChange runtime) => new()
    {
        Name = runtime.Name,
        BaseVersion = runtime.BaseVersion,
        HeadVersion = runtime.HeadVersion
    };

    private static DependencyChangeDto ToDto(DependencyChange change, DependencyVulnerabilityDelta delta) => new()
    {
        Name = change.Current.Name,
        Ecosystem = change.Current.Ecosystem.ToString(),
        BaseVersion = change.Base?.CurrentVersion,
        HeadVersion = change.Head?.CurrentVersion,
        Change = change.Kind.ToString(),
        IsMajor = change.IsMajor,
        IntroducedVulnerabilities = delta.Introduced
            .Select(vulnerability => vulnerability.CveAlias ?? vulnerability.CveId)
            .ToList()
    };

    private static ReleaseCommitDto ToDto(string title) => new()
    {
        NoteTitle = ReleaseNotes.NoteTitleOf(title),
        Category = ReleaseNotes.CategoryOf(title).ToString()
    };
}
