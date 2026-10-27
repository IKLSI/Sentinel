using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;

namespace Sentinel.Application.Projects.Search;

public class ProjectSearchValidator : IValidator
{
    public const int MaxLength = 200;

    public Task<Result> ValidateAsync(ProjectSearchModel model, CancellationToken cancellationToken) =>
        Task.FromResult(new ValidationErrors().MaxLength("q", model.Q, MaxLength).ToResult());
}
