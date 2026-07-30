namespace Sentinel.Domain.DTOs.Billing;

public class PlanQuotaDto
{
    public int Used { get; set; }
    public int Limit { get; set; }
}

public class BillingStatusDto
{
    public string PlanTier { get; set; } = string.Empty;
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
    public decimal PriceMonthly { get; set; }
    public decimal PriceAnnual { get; set; }
    public bool IsCurrent { get; set; }
}

public class CheckoutRequest
{
    public string PlanTier { get; set; } = string.Empty;
    public string BillingInterval { get; set; } = "monthly";
}

public class CheckoutSessionDto
{
    public string Url { get; set; } = string.Empty;
}
