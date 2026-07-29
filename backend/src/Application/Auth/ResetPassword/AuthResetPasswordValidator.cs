using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Auth;

namespace Sentinel.Application.Auth.ResetPassword;

public class AuthResetPasswordValidator : IValidator
{
    public Task<Result> ValidateAsync(ResetPasswordRequest model, CancellationToken cancellationToken)
    {
        ValidationErrors errors = new ValidationErrors()
            .Required(nameof(model.Token), model.Token, ValidationCodes.TokenRequired)
            .MaxLength(nameof(model.Token), model.Token, 200)
            .StrongPassword(nameof(model.Password), model.Password);

        return Task.FromResult(errors.ToResult());
    }
}
