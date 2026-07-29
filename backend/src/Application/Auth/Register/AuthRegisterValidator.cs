using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Auth;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Auth.Register;

public class AuthRegisterValidator(IUserRepository userRepository) : IValidator
{
    public async Task<Result> ValidateAsync(RegisterRequest model, CancellationToken cancellationToken)
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

        if (errors.HasErrors)
            return errors.ToResult();

        bool emailExists = await userRepository
            .ExistsByEmailAsync(model.Email.ToLower().Trim(), cancellationToken);

        if (emailExists)
            return Result.Conflict(ErrorCodes.AuthEmailAlreadyUsed);

        return Result.Success();
    }
}
