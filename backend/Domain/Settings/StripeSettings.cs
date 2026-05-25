namespace Sentinel.Domain.Settings;

public class StripeSettings
{
    public string SecretKey { get; set; } = string.Empty;
    public string WebhookSecret { get; set; } = string.Empty;
    public StripePrices Prices { get; set; } = new();
}
