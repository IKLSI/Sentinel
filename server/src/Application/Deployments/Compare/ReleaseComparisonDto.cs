using Sentinel.Application.Common.Contracts;
using Sentinel.Domain.Entities;

namespace Sentinel.Application.Deployments.Compare;

public class ReleaseComparisonDto
{
    public string HeadReference { get; set; } = string.Empty;
    public ReleaseSummaryDto Summary { get; set; } = new();
    public List<ConfigurationChangeDto> Configuration { get; set; } = [];
    public List<MigrationChangeDto> Migrations { get; set; } = [];
    public List<RuntimeChangeDto> Runtimes { get; set; } = [];
    public List<DependencyChangeDto> Dependencies { get; set; } = [];
    public List<ReleaseCommitDto> Commits { get; set; } = [];
}

public class ReleaseSummaryDto
{
    public int FixedVulnerabilityCount { get; set; }
    public bool HistoryTruncated { get; set; }
    public bool InventoryIncomplete { get; set; }
    public bool VulnerabilityDataIncomplete { get; set; }
}

public class ConfigurationChangeDto
{
    public string File { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;
    public bool RequiresValue { get; set; }
    [EnumValues(typeof(ReleaseItemSeverity))]
    public string Severity { get; set; } = string.Empty;
}

public class MigrationChangeDto
{
    public string Path { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    [EnumValues(typeof(MigrationRisk))]
    public string Risk { get; set; } = string.Empty;
    public List<MigrationOperationDto> Operations { get; set; } = [];
    [EnumValues(typeof(ReleaseItemSeverity))]
    public string Severity { get; set; } = string.Empty;
}

public class MigrationOperationDto
{
    [EnumValues(typeof(MigrationOperationKind))]
    public string Kind { get; set; } = string.Empty;
    public string? Target { get; set; }
}

public class RuntimeChangeDto
{
    public string Name { get; set; } = string.Empty;
    public string? BaseVersion { get; set; }
    public string? HeadVersion { get; set; }
}

public class DependencyChangeDto
{
    public string Name { get; set; } = string.Empty;
    [EnumValues(typeof(DependencyEcosystem))]
    public string Ecosystem { get; set; } = string.Empty;
    public string? BaseVersion { get; set; }
    public string? HeadVersion { get; set; }
    [EnumValues(typeof(DependencyChangeKind))]
    public string Change { get; set; } = string.Empty;
    public bool IsMajor { get; set; }
    public List<string> IntroducedVulnerabilities { get; set; } = [];
}

public class ReleaseCommitDto
{
    public string NoteTitle { get; set; } = string.Empty;
    [EnumValues(typeof(ReleaseCommitCategory))]
    public string Category { get; set; } = string.Empty;
}
