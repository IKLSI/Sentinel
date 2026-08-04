using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Models;

namespace Sentinel.Application.Billing.Checkout;

public class BillingCheckoutValidator : IValidator
{
    public Result Validate(CheckoutRequest model, out PlanTier tier)
    {
        if (!Enum.TryParse(model.PlanTier, true, out tier) || tier == PlanTier.Free)
            return Result.Error(ErrorCodes.BillingInvalidPlan);

        return Result.Success();
    }
}
