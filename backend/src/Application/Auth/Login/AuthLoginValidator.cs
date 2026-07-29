using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Auth;

namespace Sentinel.Application.Auth.Login;

public class AuthLoginValidator : IValidator
{
    public Task<Result> ValidateAsync(LoginRequest model, CancellationToken cancellationToken)
    {
        ValidationErrors errors = new ValidationErrors()
            .EmailAddress(nameof(model.Email), model.Email, ValidationCodes.EmailRequired)
            .Required(nameof(model.Password), model.Password, ValidationCodes.PasswordRequired)
            .MaxLength(nameof(model.Password), model.Password, 128, ValidationCodes.PasswordMaxLength);

        return Task.FromResult(errors.ToResult());
    }
}
