using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;

namespace Sentinel.Application.Dashboard.GetStats;

public class DashboardStatsValidator : IValidator
{
    public Task<Result> ValidateAsync(DashboardStatsRequest model, CancellationToken cancellationToken)
    {
        ValidationErrors errors = new ValidationErrors()
            .DefinedEnum(nameof(model.Period), model.Period, ValidationCodes.InvalidValue);

        return Task.FromResult(errors.ToResult());
    }
}
