using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;

namespace Sentinel.Application.Settings.UpdateOrganization;

public class OrganizationSettingsUpdateValidator : IValidator
{
    public Task<Result> ValidateAsync(UpdateOrganizationSettingsDto model, CancellationToken cancellationToken)
    {
        ValidationErrors errors = new ValidationErrors()
            .Required(nameof(model.Name), model.Name, ValidationCodes.OrganizationNameRequired)
            .MaxLength(nameof(model.Name), model.Name, 200, ValidationCodes.OrganizationNameMaxLength)
            .DefinedEnum(nameof(model.AlertMinSeverity), model.AlertMinSeverity,
                ValidationCodes.OrganizationAlertSeverityInvalid);

        return Task.FromResult(errors.ToResult());
    }
}
