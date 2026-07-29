using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.TechHealth;
using Sentinel.Domain.Models;

namespace Sentinel.Application.TechHealth.UpdateProject;

public class ProjectUpdateValidator : IValidator
{
    public Task<Result> ValidateAsync(UpdateProjectDto model, CancellationToken cancellationToken)
    {
        ValidationErrors errors = new ValidationErrors()
            .Required(nameof(model.ScanFrequency), model.ScanFrequency,
                ValidationCodes.ProjectScanFrequencyInvalid)
            .MaxLength(nameof(model.ScanFrequency), model.ScanFrequency, 50)
            .ParsableEnum<ScanFrequency>(nameof(model.ScanFrequency), model.ScanFrequency,
                ValidationCodes.ProjectScanFrequencyInvalid);

        return Task.FromResult(errors.ToResult());
    }
}
