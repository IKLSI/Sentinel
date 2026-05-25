namespace Sentinel.Domain.DTOs.Billing;

public class PlanQuotaDto
{
    public int Used { get; set; }
    public int Limit { get; set; }
}

public class BillingStatusDto
{
    public string PlanTier { get; set; } = string.Empty;
    public string SubscriptionStatus { get; set; } = string.Empty;
    public DateTime? CurrentPeriodEnd { get; set; }
    public bool HasActiveSubscription { get; set; }
    public PlanQuotaDto Projects { get; set; } = new();
    public PlanQuotaDto Members { get; set; } = new();
    public PlanQuotaDto Scans { get; set; } = new();
}

public class PlanOptionDto
{
    public string Tier { get; set; } = string.Empty;
    public int MaxProjects { get; set; }
    public int MaxMembers { get; set; }
    public int MaxScansPerMonth { get; set; }
    public bool IsCurrent { get; set; }
}

public class CheckoutRequest
{
    public string PlanTier { get; set; } = string.Empty;
}

public class CheckoutSessionDto
{
    public string Url { get; set; } = string.Empty;
}
