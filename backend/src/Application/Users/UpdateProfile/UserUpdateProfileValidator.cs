using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;

namespace Sentinel.Application.Users.UpdateProfile;

public class UserUpdateProfileValidator : IValidator
{
    public Task<Result> ValidateAsync(UpdateMyProfileDto model, CancellationToken cancellationToken)
    {
        ValidationErrors errors = new ValidationErrors()
            .MaxLength(nameof(model.FirstName), model.FirstName, 100)
            .MaxLength(nameof(model.LastName), model.LastName, 100);

        return Task.FromResult(errors.ToResult());
    }
}
