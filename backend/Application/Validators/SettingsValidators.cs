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

        RuleFor(x => x.AlertMinSeverity)
            .IsInEnum().WithMessage("Sévérité d'alerte invalide");
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
