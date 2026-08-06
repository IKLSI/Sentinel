using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;

namespace Sentinel.Application.Users.AcceptInvitation;

public class UserAcceptInvitationValidator : IValidator
{
    public Task<Result> ValidateAsync(AcceptInvitationDto model, CancellationToken cancellationToken)
    {
        ValidationErrors errors = new ValidationErrors()
            .Required(nameof(model.Token), model.Token, ValidationCodes.TokenRequired)
            .MaxLength(nameof(model.Token), model.Token, 200)
            .Required(nameof(model.FirstName), model.FirstName, ValidationCodes.FirstNameRequired)
            .MaxLength(nameof(model.FirstName), model.FirstName, 100)
            .Required(nameof(model.LastName), model.LastName, ValidationCodes.LastNameRequired)
            .MaxLength(nameof(model.LastName), model.LastName, 100)
            .StrongPassword(nameof(model.Password), model.Password);

        return Task.FromResult(errors.ToResult());
    }
}
