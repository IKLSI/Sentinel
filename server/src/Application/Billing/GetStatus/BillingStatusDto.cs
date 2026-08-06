namespace Sentinel.Application.Billing.GetStatus;

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
