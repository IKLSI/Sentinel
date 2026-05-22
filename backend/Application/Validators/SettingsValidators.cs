using FluentValidation;
using Sentinel.Domain.DTOs.Settings;

namespace Sentinel.Application.Validators;

public class UpdateOrganizationSettingsDtoValidator : AbstractValidator<UpdateOrganizationSettingsDto>
{
    public UpdateOrganizationSettingsDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Le nom de l'organisation est requis")
            .MaximumLength(200).WithMessage("Le nom ne peut pas dépasser 200 caractères");

        RuleFor(x => x.Timezone)
            .MaximumLength(100).WithMessage("Le fuseau horaire est trop long")
            .Must(BeValidTimezone).WithMessage("Fuseau horaire invalide")
            .When(x => !string.IsNullOrEmpty(x.Timezone));
    }

    private static bool BeValidTimezone(string tz)
    {
        try
        {
            TimeZoneInfo.FindSystemTimeZoneById(tz);
            return true;
        }
        catch
        {
            return false;
        }
    }
}

public class ConnectIntegrationDtoValidator : AbstractValidator<ConnectIntegrationDto>
{
    public ConnectIntegrationDtoValidator()
    {
        RuleFor(x => x.Token)
            .NotEmpty().WithMessage("Le token est requis")
            .MaximumLength(500).WithMessage("Le token est trop long");
    }
}
