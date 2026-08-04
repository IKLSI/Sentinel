using System.ComponentModel.DataAnnotations;

namespace Sentinel.Application.Options;

public class StripeSettings
{
    [Required(ErrorMessage = "Stripe:SecretKey is required in the configuration")]
    public string SecretKey { get; set; } = string.Empty;

    [Required(ErrorMessage = "Stripe:WebhookSecret is required in the configuration")]
    public string WebhookSecret { get; set; } = string.Empty;

    public StripePrices Prices { get; set; } = new();
}
