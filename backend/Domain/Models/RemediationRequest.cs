namespace Sentinel.Domain.Models;

public enum RemediationStatus
{
    Pending,
    PullRequestOpen,
    NoChanges,
    Failed
}

public class RemediationRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Guid OrganizationId { get; set; }
    public RemediationStatus Status { get; set; } = RemediationStatus.Pending;
    public string? PullRequestUrl { get; set; }
    public string? BranchName { get; set; }
    public int DependenciesPatched { get; set; }
    public bool HasBreakingChanges { get; set; }
    public string? TargetsJson { get; set; }
    public string? Error { get; set; }
    public Guid? CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }

    public Project Project { get; set; } = null!;
}
