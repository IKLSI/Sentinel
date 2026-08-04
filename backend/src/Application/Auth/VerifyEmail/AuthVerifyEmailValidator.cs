using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;

namespace Sentinel.Application.Auth.VerifyEmail;

public class AuthVerifyEmailValidator : IValidator
{
    public Task<Result> ValidateAsync(VerifyEmailRequest model, CancellationToken cancellationToken)
    {
        ValidationErrors errors = new ValidationErrors()
            .Required(nameof(model.Token), model.Token, ValidationCodes.TokenRequired)
            .MaxLength(nameof(model.Token), model.Token, 200);

        return Task.FromResult(errors.ToResult());
    }
}
