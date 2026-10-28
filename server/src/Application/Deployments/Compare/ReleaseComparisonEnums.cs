namespace Sentinel.Application.Deployments.Compare;

public enum ReleaseItemSeverity
{
    Blocking,
    Warning
}

public enum ReleaseChangeKind
{
    Added,
    Removed,
    Modified
}

public enum DependencyChangeKind
{
    Added,
    Removed,
    Upgraded,
    Downgraded
}

public enum MigrationRisk
{
    Safe,
    Risky,
    Destructive
}

public enum MigrationOperationKind
{
    DropTable,
    DropColumn,
    DropSchema,
    Truncate,
    DeleteRows,
    RenameTable,
    RenameColumn,
    AlterColumn,
    RawSql
}

public enum ReleaseCommitCategory
{
    Feature,
    Fix,
    Maintenance
}
