using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;

namespace Sentinel.Application.TechHealth.Remediation.StartRemediation;

public class StartRemediationValidator : IValidator
{
    public const int FindingKeyMaxLength = 500;

    public Task<Result> ValidateAsync(StartRemediationDto model, CancellationToken cancellationToken) =>
        Task.FromResult(new ValidationErrors()
            .Required(nameof(model.FindingKey), model.FindingKey, ValidationCodes.RemediationFindingKeyRequired)
            .MaxLength(nameof(model.FindingKey), model.FindingKey, FindingKeyMaxLength)
            .ToResult());
}
