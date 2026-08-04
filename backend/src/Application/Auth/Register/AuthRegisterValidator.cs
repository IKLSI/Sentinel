using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;

namespace Sentinel.Application.Auth.Register;

public class AuthRegisterValidator : IValidator
{
    public Task<Result> ValidateAsync(RegisterRequest model, CancellationToken cancellationToken)
    {
        ValidationErrors errors = new ValidationErrors()
            .EmailAddress(nameof(model.Email), model.Email, ValidationCodes.EmailRequired)
            .StrongPassword(nameof(model.Password), model.Password)
            .Required(nameof(model.FirstName), model.FirstName, ValidationCodes.FirstNameRequired)
            .MaxLength(nameof(model.FirstName), model.FirstName, 100)
            .Required(nameof(model.LastName), model.LastName, ValidationCodes.LastNameRequired)
            .MaxLength(nameof(model.LastName), model.LastName, 100)
            .Required(nameof(model.OrganizationName), model.OrganizationName,
                ValidationCodes.OrganizationNameRequired)
            .MinLength(nameof(model.OrganizationName), model.OrganizationName, 2,
                ValidationCodes.OrganizationNameMinLength)
            .MaxLength(nameof(model.OrganizationName), model.OrganizationName, 200,
                ValidationCodes.OrganizationNameMaxLength);

        return Task.FromResult(errors.ToResult());
    }
}
