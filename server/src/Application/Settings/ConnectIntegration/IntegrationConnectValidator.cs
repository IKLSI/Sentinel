using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;

namespace Sentinel.Application.Settings.ConnectIntegration;

public class IntegrationConnectValidator : IValidator
{
    private const int MaxTokenLength = 1000;
    private const int MaxBaseUrlLength = 500;

    public Task<Result> ValidateAsync(ConnectIntegrationDto model, RepositoryType platform,
        CancellationToken cancellationToken)
    {
        ValidationErrors errors = new ValidationErrors()
            .Required(nameof(model.Token), model.Token, ValidationCodes.OrganizationTokenRequired)
            .MaxLength(nameof(model.Token), model.Token, MaxTokenLength, ValidationCodes.OrganizationTokenMaxLength);

        if (platform == RepositoryType.GitLab)
        {
            errors
                .MaxLength(nameof(model.BaseUrl), model.BaseUrl, MaxBaseUrlLength,
                    ValidationCodes.OrganizationGitlabUrlMaxLength)
                .HttpsUrl(nameof(model.BaseUrl), model.BaseUrl, ValidationCodes.OrganizationGitlabUrlInvalid);
        }

        return Task.FromResult(errors.ToResult());
    }
}
