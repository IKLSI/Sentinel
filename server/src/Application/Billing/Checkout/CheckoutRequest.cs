namespace Sentinel.Application.Billing.Checkout;

public class CheckoutRequest
{
    public string PlanTier { get; set; } = string.Empty;
    public string BillingInterval { get; set; } = "monthly";
}
