using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Models;

namespace Sentinel.Application.Users.UpdatePreferences;

public class UserUpdatePreferencesValidator : IValidator
{
    public Task<Result> ValidateAsync(UpdatePreferencesDto model, CancellationToken cancellationToken)
    {
        ValidationErrors errors = new ValidationErrors()
            .ParsableEnum<ThemeType>(nameof(model.Theme), model.Theme, ValidationCodes.ThemeInvalid);

        return Task.FromResult(errors.ToResult());
    }
}
