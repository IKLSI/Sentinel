using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;

namespace Sentinel.Application.Users.Grid;

public class UserGridValidator : IValidator
{
    public Task<Result> ValidateAsync(UserGridModel model, CancellationToken cancellationToken) =>
        Task.FromResult(UserFilterParser.Validate(model));
}
