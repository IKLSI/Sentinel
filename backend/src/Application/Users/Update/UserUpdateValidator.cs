using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;

namespace Sentinel.Application.Users.Update;

public class UserUpdateValidator : IValidator
{
    public Task<Result> ValidateAsync(UpdateUserDto model, CancellationToken cancellationToken)
    {
        ValidationErrors errors = new ValidationErrors()
            .MaxLength(nameof(model.FirstName), model.FirstName, 100)
            .MaxLength(nameof(model.LastName), model.LastName, 100)
            .ParsableEnum<UserRole>(nameof(model.Role), model.Role, ValidationCodes.RoleInvalid);

        return Task.FromResult(errors.ToResult());
    }
}
