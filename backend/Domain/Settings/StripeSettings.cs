using System.ComponentModel.DataAnnotations;

namespace Sentinel.Domain.Settings;

public class StripeSettings
{
    [Required(ErrorMessage = "Stripe:SecretKey est requis dans la configuration")]
    public string SecretKey { get; set; } = string.Empty;

    [Required(ErrorMessage = "Stripe:WebhookSecret est requis dans la configuration")]
    public string WebhookSecret { get; set; } = string.Empty;

    public StripePrices Prices { get; set; } = new();
}
