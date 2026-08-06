namespace Sentinel.Application.Billing.GetPlans;

public class PlanOptionDto
{
    public string Tier { get; set; } = string.Empty;
    public int MaxProjects { get; set; }
    public int MaxMembers { get; set; }
    public int MaxScansPerMonth { get; set; }
    public decimal PriceMonthly { get; set; }
    public bool IsCurrent { get; set; }
}
