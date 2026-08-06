namespace Sentinel.Domain.Billing;

public class BillingProviderException : Exception
{
    public BillingProviderException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
