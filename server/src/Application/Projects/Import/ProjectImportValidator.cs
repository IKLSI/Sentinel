using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Projects.Create;
using Sentinel.Domain.Constants;

namespace Sentinel.Application.Projects.Import;

public class ProjectImportValidator(ProjectCreateValidator projectValidator) : IValidator
{
    private const int MaxImportedProjects = 100;

    public async Task<Result> ValidateAsync(ImportProjectsDto model, string gitLabHost,
        CancellationToken cancellationToken)
    {
        if (model.Projects.Count is 0 or > MaxImportedProjects)
            return new ValidationErrors().Add(nameof(model.Projects), ValidationCodes.InvalidValue).ToResult();

        foreach (CreateProjectDto project in model.Projects)
        {
            Result projectResult = await projectValidator.ValidateAsync(project, gitLabHost, cancellationToken);

            if (!projectResult.IsSuccess) return projectResult;
        }

        return Result.Success();
    }
}
