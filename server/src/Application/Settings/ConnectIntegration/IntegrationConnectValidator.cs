using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;

namespace Sentinel.Application.Settings.ConnectIntegration;

public class IntegrationConnectValidator : IValidator
{
    private const int MaxTokenLength = 1000;

    public Task<Result> ValidateAsync(ConnectIntegrationDto model, CancellationToken cancellationToken)
    {
        ValidationErrors errors = new ValidationErrors()
            .Required(nameof(model.Token), model.Token, ValidationCodes.OrganizationTokenRequired)
            .MaxLength(nameof(model.Token), model.Token, MaxTokenLength, ValidationCodes.OrganizationTokenMaxLength);

        return Task.FromResult(errors.ToResult());
    }
}
