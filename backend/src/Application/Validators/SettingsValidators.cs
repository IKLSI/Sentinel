using FluentValidation;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Settings;

namespace Sentinel.Application.Validators;

public class UpdateOrganizationSettingsDtoValidator : AbstractValidator<UpdateOrganizationSettingsDto>
{
    public UpdateOrganizationSettingsDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage(ValidationCodes.OrganizationNameRequired)
            .MaximumLength(200).WithMessage(ValidationCodes.OrganizationNameMaxLength);

        RuleFor(x => x.AlertMinSeverity)
            .IsInEnum().WithMessage(ValidationCodes.OrganizationAlertSeverityInvalid);
    }
}

public class ConnectIntegrationDtoValidator : AbstractValidator<ConnectIntegrationDto>
{
    public ConnectIntegrationDtoValidator()
    {
        RuleFor(x => x.Token)
            .NotEmpty().WithMessage(ValidationCodes.OrganizationTokenRequired)
            .MaximumLength(500).WithMessage(ValidationCodes.OrganizationTokenMaxLength);
    }
}
