namespace Sentinel.Domain.DTOs.Remediation;

public class RemediationTargetDto
{
    public string Name { get; set; } = string.Empty;
    public string Ecosystem { get; set; } = string.Empty;
    public string CurrentVersion { get; set; } = string.Empty;
    public string TargetVersion { get; set; } = string.Empty;
    public bool IsBreaking { get; set; }
    public List<string> CveIds { get; set; } = new();
}

public class StaleLockfileDto
{
    public string Path { get; set; } = string.Empty;
    public string Command { get; set; } = string.Empty;
}

public class RemediationPreviewDto
{
    public bool CanRemediate { get; set; }
    public string? Reason { get; set; }
    public bool HasBreakingChanges { get; set; }
    public List<RemediationTargetDto> Targets { get; set; } = new();
    public List<string> Files { get; set; } = new();
    public List<StaleLockfileDto> StaleLockfiles { get; set; } = new();
}

public class RemediationResultDto
{
    public Guid Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? PullRequestUrl { get; set; }
    public string? Error { get; set; }
    public int DependenciesPatched { get; set; }
    public bool HasBreakingChanges { get; set; }
    public List<StaleLockfileDto> StaleLockfiles { get; set; } = new();
}

public class RemediationHistoryDto
{
    public Guid Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? PullRequestUrl { get; set; }
    public int DependenciesPatched { get; set; }
    public bool HasBreakingChanges { get; set; }
    public string? Error { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}
