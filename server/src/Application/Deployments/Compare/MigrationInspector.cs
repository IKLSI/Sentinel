using System.Text.RegularExpressions;

namespace Sentinel.Application.Deployments.Compare;

public sealed record MigrationOperation(MigrationOperationKind Kind, string? Target);

public sealed record MigrationAnalysis(MigrationRisk Risk, List<MigrationOperation> Operations);

public static partial class MigrationInspector
{
    private const string MigrationSegment = "migrat";
    private const string CSharpExtension = ".cs";
    private const string SqlExtension = ".sql";
    private const string DesignerSuffix = ".Designer.cs";
    private const string SnapshotSuffix = "ModelSnapshot.cs";
    private const string DownMethodMarker = "override void Down";

    private static readonly HashSet<MigrationOperationKind> DestructiveKinds =
    [
        MigrationOperationKind.DropTable, MigrationOperationKind.DropColumn, MigrationOperationKind.DropSchema,
        MigrationOperationKind.Truncate, MigrationOperationKind.DeleteRows
    ];

    public static bool IsMigrationFile(string path)
    {
        string[] segments = path.Replace('\\', '/').Split('/');
        if (!segments[..^1].Any(segment => segment.Contains(MigrationSegment, StringComparison.OrdinalIgnoreCase)))
            return false;

        string fileName = segments[^1];

        return fileName.EndsWith(SqlExtension, StringComparison.OrdinalIgnoreCase)
            || (fileName.EndsWith(CSharpExtension, StringComparison.OrdinalIgnoreCase)
                && !fileName.EndsWith(DesignerSuffix, StringComparison.OrdinalIgnoreCase)
                && !fileName.EndsWith(SnapshotSuffix, StringComparison.OrdinalIgnoreCase));
    }

    public static MigrationAnalysis Inspect(string path, string? content)
    {
        if (string.IsNullOrEmpty(content)) return new MigrationAnalysis(MigrationRisk.Safe, []);

        List<MigrationOperation> operations = path.EndsWith(SqlExtension, StringComparison.OrdinalIgnoreCase)
            ? InspectSql(content)
            : InspectEntityFramework(UpSection(content));

        return new MigrationAnalysis(RiskOf(operations), operations);
    }

    private static MigrationRisk RiskOf(List<MigrationOperation> operations)
    {
        if (operations.Any(operation => DestructiveKinds.Contains(operation.Kind))) return MigrationRisk.Destructive;
        return operations.Count > 0 ? MigrationRisk.Risky : MigrationRisk.Safe;
    }

    private static string UpSection(string content)
    {
        int downIndex = content.IndexOf(DownMethodMarker, StringComparison.Ordinal);
        return downIndex < 0 ? content : content[..downIndex];
    }

    private static List<MigrationOperation> InspectEntityFramework(string content) =>
        EntityFrameworkOperationPattern().Matches(content)
            .Select(match => Enum.TryParse(match.Groups["operation"].Value, out MigrationOperationKind kind)
                ? new MigrationOperation(kind, EntityFrameworkTarget(kind, match.Groups["arguments"].Value))
                : new MigrationOperation(MigrationOperationKind.RawSql, null))
            .ToList();

    private static string? EntityFrameworkTarget(MigrationOperationKind kind, string arguments)
    {
        string? name = NamedArgument("name", arguments);
        string? table = NamedArgument("table", arguments);

        return kind switch
        {
            MigrationOperationKind.RawSql => null,
            MigrationOperationKind.DropTable or MigrationOperationKind.RenameTable
                or MigrationOperationKind.DropSchema => name,
            _ => table == null ? name : $"{table}.{name}"
        };
    }

    private static string? NamedArgument(string argument, string arguments)
    {
        Match match = Regex.Match(arguments, $@"\b{argument}:\s*""(?<value>[^""]*)""", RegexOptions.None,
            TimeSpan.FromSeconds(1));
        return match.Success ? match.Groups["value"].Value : null;
    }

    private static List<MigrationOperation> InspectSql(string content)
    {
        List<MigrationOperation> operations = [];

        foreach ((Regex pattern, MigrationOperationKind kind) in SqlPatterns())
        {
            operations.AddRange(pattern.Matches(content)
                .Select(match => new MigrationOperation(kind,
                    match.Groups["target"].Success ? match.Groups["target"].Value : null)));
        }

        return operations;
    }

    private static IEnumerable<(Regex Pattern, MigrationOperationKind Kind)> SqlPatterns() =>
    [
        (SqlDropTablePattern(), MigrationOperationKind.DropTable),
        (SqlDropColumnPattern(), MigrationOperationKind.DropColumn),
        (SqlDropSchemaPattern(), MigrationOperationKind.DropSchema),
        (SqlTruncatePattern(), MigrationOperationKind.Truncate),
        (SqlDeletePattern(), MigrationOperationKind.DeleteRows),
        (SqlRenamePattern(), MigrationOperationKind.RenameColumn),
        (SqlAlterColumnPattern(), MigrationOperationKind.AlterColumn)
    ];

    [GeneratedRegex(
        @"migrationBuilder\s*\.\s*(?<operation>DropTable|DropColumn|DropSchema|RenameTable|RenameColumn|AlterColumn|Sql)\s*(?:<[^>]+>)?\s*\((?<arguments>.*?)\)\s*;",
        RegexOptions.Singleline, 1000)]
    private static partial Regex EntityFrameworkOperationPattern();

    [GeneratedRegex(@"\bDROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?<target>[\w.""\[\]`]+)", RegexOptions.IgnoreCase, 1000)]
    private static partial Regex SqlDropTablePattern();

    [GeneratedRegex(@"\bDROP\s+COLUMN\s+(?:IF\s+EXISTS\s+)?(?<target>[\w.""\[\]`]+)", RegexOptions.IgnoreCase, 1000)]
    private static partial Regex SqlDropColumnPattern();

    [GeneratedRegex(@"\bDROP\s+SCHEMA\s+(?:IF\s+EXISTS\s+)?(?<target>[\w.""\[\]`]+)", RegexOptions.IgnoreCase, 1000)]
    private static partial Regex SqlDropSchemaPattern();

    [GeneratedRegex(@"\bTRUNCATE\s+(?:TABLE\s+)?(?<target>[\w.""\[\]`]+)", RegexOptions.IgnoreCase, 1000)]
    private static partial Regex SqlTruncatePattern();

    [GeneratedRegex(@"\bDELETE\s+FROM\s+(?<target>[\w.""\[\]`]+)", RegexOptions.IgnoreCase, 1000)]
    private static partial Regex SqlDeletePattern();

    [GeneratedRegex(@"\bRENAME\s+(?:COLUMN\s+)?(?<target>[\w.""\[\]`]+)\s+TO\b", RegexOptions.IgnoreCase, 1000)]
    private static partial Regex SqlRenamePattern();

    [GeneratedRegex(@"\b(?:ALTER|MODIFY)\s+COLUMN\s+(?<target>[\w.""\[\]`]+)", RegexOptions.IgnoreCase, 1000)]
    private static partial Regex SqlAlterColumnPattern();
}
