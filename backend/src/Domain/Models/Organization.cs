using Sentinel.Domain.Abstractions.Persistence;
namespace Sentinel.Domain.Models;

public class Organization : IEntityWithId
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public bool SecurityAlertsEnabled { get; set; } = true;
    public VulnerabilitySeverity AlertMinSeverity { get; set; } = VulnerabilitySeverity.High;
    public string? GithubToken { get; set; }
    public string? GitlabToken { get; set; }

    public PlanTier PlanTier { get; set; } = PlanTier.Free;
    public SubscriptionStatus SubscriptionStatus { get; set; } = SubscriptionStatus.None;
    public string? StripeCustomerId { get; set; }
    public string? StripeSubscriptionId { get; set; }
    public DateTime? CurrentPeriodEnd { get; set; }
    public DateTime? LastBillingEventAt { get; set; }
    public int MonthlyScanCount { get; set; }
    public DateTime ScanCountPeriodStart { get; set; } = DateTime.UtcNow;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<User> Users { get; set; } = new List<User>();
}
