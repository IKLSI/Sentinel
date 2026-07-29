using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Settings;

namespace Sentinel.Application.Settings.ConnectIntegration;

public class IntegrationConnectValidator : IValidator
{
    public Task<Result> ValidateAsync(ConnectIntegrationDto model, CancellationToken cancellationToken)
    {
        ValidationErrors errors = new ValidationErrors()
            .Required(nameof(model.Token), model.Token, ValidationCodes.OrganizationTokenRequired)
            .MaxLength(nameof(model.Token), model.Token, 500, ValidationCodes.OrganizationTokenMaxLength);

        return Task.FromResult(errors.ToResult());
    }
}
