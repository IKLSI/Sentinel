using System.ComponentModel.DataAnnotations;

namespace Sentinel.Infrastructure.Payments;

public class StripeSettings
{
    [Required(ErrorMessage = "Stripe:SecretKey is required in the configuration")]
    public string SecretKey { get; set; } = string.Empty;

    [Required(ErrorMessage = "Stripe:WebhookSecret is required in the configuration")]
    public string WebhookSecret { get; set; } = string.Empty;
}
