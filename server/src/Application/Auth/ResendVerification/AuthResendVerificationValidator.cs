using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;

namespace Sentinel.Application.Auth.ResendVerification;

public class AuthResendVerificationValidator : IValidator
{
    public Task<Result> ValidateAsync(ResendVerificationRequest model, CancellationToken cancellationToken)
    {
        ValidationErrors errors = new ValidationErrors()
            .EmailAddress(nameof(model.Email), model.Email, ValidationCodes.EmailRequired);

        return Task.FromResult(errors.ToResult());
    }
}
