using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Billing;
using Stripe;
using CheckoutSession = Stripe.Checkout.Session;
using CheckoutSessionOptions = Stripe.Checkout.SessionCreateOptions;
using CheckoutSessionService = Stripe.Checkout.SessionService;

namespace Sentinel.Infrastructure.Payments;

public class StripeBillingGateway(
    IStripeClient stripeClient,
    IOptions<StripeSettings> stripeSettings,
    ILogger<StripeBillingGateway> logger) : IBillingGateway
{
    private const string SubscriptionMode = "subscription";
    // private const string TermsOfServiceRequired = "required";

    public async Task<string> CreateCustomerAsync(BillingCustomerRequest request,
        CancellationToken cancellationToken)
    {
        CustomerCreateOptions options = new()
        {
            Name = request.OrganizationName,
            Email = request.AdminEmail,
            Metadata = new Dictionary<string, string>
            {
                [StripeMetadataKeys.OrganizationId] = request.OrganizationId.ToString()
            }
        };

        try
        {
            Customer customer = await new CustomerService(stripeClient)
                .CreateAsync(options, cancellationToken: cancellationToken);

            return customer.Id;
        }
        catch (StripeException exception)
        {
            throw new BillingProviderException("Unable to create the billing customer", exception);
        }
    }

    public async Task<string> CreateCheckoutSessionAsync(BillingCheckoutRequest request,
        CancellationToken cancellationToken)
    {
        CheckoutSessionOptions options = new()
        {
            Mode = SubscriptionMode,
            Customer = request.CustomerId,
            ClientReferenceId = request.OrganizationId.ToString(),
            LineItems = [new Stripe.Checkout.SessionLineItemOptions { Price = request.PriceId, Quantity = 1 }],
            SuccessUrl = request.SuccessUrl,
            CancelUrl = request.CancelUrl,
            /* ConsentCollection = new Stripe.Checkout.SessionConsentCollectionOptions
            {
                TermsOfService = TermsOfServiceRequired
            }, */
            BillingAddressCollection = "required",
            CustomerUpdate = new Stripe.Checkout.SessionCustomerUpdateOptions
            {
                Address = "auto",
                Name = "auto"
            },
            AutomaticTax = new Stripe.Checkout.SessionAutomaticTaxOptions
            {
                Enabled = stripeSettings.Value.EnableAutomaticTax
            },
            TaxIdCollection = new Stripe.Checkout.SessionTaxIdCollectionOptions
            {
                Enabled = stripeSettings.Value.EnableAutomaticTax
            },
            Metadata = new Dictionary<string, string>
            {
                [StripeMetadataKeys.OrganizationId] = request.OrganizationId.ToString(),
                [StripeMetadataKeys.PlanTier] = request.Tier.ToString()
            }
        };

        try
        {
            CheckoutSession session = await new CheckoutSessionService(stripeClient)
                .CreateAsync(options, cancellationToken: cancellationToken);

            return session.Url;
        }
        catch (StripeException exception)
        {
            throw new BillingProviderException("Unable to create the checkout session", exception);
        }
    }

    public async Task<string> CreatePortalSessionAsync(string customerId, string returnUrl,
        CancellationToken cancellationToken)
    {
        Stripe.BillingPortal.SessionCreateOptions options = new()
        {
            Customer = customerId,
            ReturnUrl = returnUrl
        };

        try
        {
            Stripe.BillingPortal.Session session = await new Stripe.BillingPortal.SessionService(stripeClient)
                .CreateAsync(options, cancellationToken: cancellationToken);

            return session.Url;
        }
        catch (StripeException exception)
        {
            throw new BillingProviderException("Unable to create the billing portal session", exception);
        }
    }

    public async Task<decimal?> GetPriceAmountOrDefaultAsync(string priceId, CancellationToken cancellationToken)
    {
        try
        {
            Price price = await new PriceService(stripeClient).GetAsync(priceId, cancellationToken: cancellationToken);

            return (price.UnitAmount ?? 0) / 100m;
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Unable to fetch the Stripe price {PriceId}", priceId);

            return null;
        }
    }
}
