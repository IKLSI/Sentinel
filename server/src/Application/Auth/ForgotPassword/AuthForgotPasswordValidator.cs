using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;

namespace Sentinel.Application.Auth.ForgotPassword;

public class AuthForgotPasswordValidator : IValidator
{
    public Task<Result> ValidateAsync(ForgotPasswordRequest model, CancellationToken cancellationToken)
    {
        ValidationErrors errors = new ValidationErrors()
            .EmailAddress(nameof(model.Email), model.Email, ValidationCodes.EmailRequired);

        return Task.FromResult(errors.ToResult());
    }
}
