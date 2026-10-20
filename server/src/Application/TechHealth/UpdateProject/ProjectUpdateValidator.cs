using System.Text.RegularExpressions;
using Sentinel.Domain.TechHealth;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;

namespace Sentinel.Application.TechHealth.UpdateProject;

public partial class ProjectUpdateValidator : IValidator
{
    private const int BranchMaxLength = 255;

    public Task<Result> ValidateAsync(UpdateProjectDto model, CancellationToken cancellationToken)
    {
        ValidationErrors errors = new ValidationErrors()
            .Required(nameof(model.ScanFrequency), model.ScanFrequency,
                ValidationCodes.ProjectScanFrequencyInvalid)
            .MaxLength(nameof(model.ScanFrequency), model.ScanFrequency, 50)
            .ParsableEnum<ScanFrequency>(nameof(model.ScanFrequency), model.ScanFrequency,
                ValidationCodes.ProjectScanFrequencyInvalid);

        if (!IsValidBranch(model.Branch))
            errors.Add(nameof(model.Branch), ValidationCodes.ProjectBranchInvalid);

        if (!RepositoryScanPaths.IsValidRootPath(model.RootPath))
            errors.Add(nameof(model.RootPath), ValidationCodes.ProjectRootPathInvalid);

        return Task.FromResult(errors.ToResult());
    }

    private static bool IsValidBranch(string? branch) =>
        string.IsNullOrWhiteSpace(branch)
        || (branch.Trim().Length <= BranchMaxLength
            && BranchRegex().IsMatch(branch.Trim())
            && !branch.Contains("..", StringComparison.Ordinal));

    [GeneratedRegex(@"^[A-Za-z0-9._/\-]+$")]
    private static partial Regex BranchRegex();
}
