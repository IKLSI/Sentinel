using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;

namespace Sentinel.Application.Deployments.Compare;

public class ReleaseComparisonValidator : IValidator
{
    public const int MaxReferenceLength = 255;

    public Task<Result> ValidateAsync(ReleaseComparisonModel model, CancellationToken cancellationToken)
    {
        ValidationErrors errors = new ValidationErrors()
            .Required("base", model.Base, ValidationCodes.DeploymentReferenceRequired)
            .Required("head", model.Head, ValidationCodes.DeploymentReferenceRequired)
            .MaxLength("base", model.Base, MaxReferenceLength)
            .MaxLength("head", model.Head, MaxReferenceLength);

        if (!errors.HasErrors && model.Base!.Trim() == model.Head!.Trim())
            errors.Add("head", ValidationCodes.DeploymentReferencesIdentical);

        return Task.FromResult(errors.ToResult());
    }
}
