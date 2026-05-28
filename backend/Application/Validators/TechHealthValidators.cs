using FluentValidation;
using Sentinel.Domain.DTOs.TechHealth;
using Sentinel.Domain.Models;

namespace Sentinel.Application.Validators;

public class CreateProjectDtoValidator : AbstractValidator<CreateProjectDto>
{
    public CreateProjectDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Le nom du projet est requis")
            .MaximumLength(200).WithMessage("Le nom ne peut pas dépasser 200 caractères");

        RuleFor(x => x.RepositoryUrl)
            .MaximumLength(500)
            .Must(TechHealthValidatorHelpers.BeValidHttpUrl).WithMessage("URL de dépôt invalide")
            .When(x => !string.IsNullOrEmpty(x.RepositoryUrl));

        RuleFor(x => x.RepositoryType)
            .NotEmpty()
            .MaximumLength(50)
            .Must(t => Enum.TryParse<RepositoryType>(t, out _))
            .WithMessage($"Type de dépôt invalide ({string.Join(", ", Enum.GetNames<RepositoryType>())})");

        RuleFor(x => x.ScanFrequency)
            .NotEmpty()
            .MaximumLength(50)
            .Must(f => Enum.TryParse<ScanFrequency>(f, out _))
            .WithMessage($"Fréquence invalide ({string.Join(", ", Enum.GetNames<ScanFrequency>())})");

    }

}

public class UpdateProjectDtoValidator : AbstractValidator<UpdateProjectDto>
{
    public UpdateProjectDtoValidator()
    {
        RuleFor(x => x.ScanFrequency)
            .NotEmpty()
            .MaximumLength(50)
            .Must(f => Enum.TryParse<ScanFrequency>(f, out _))
            .WithMessage($"Fréquence invalide ({string.Join(", ", Enum.GetNames<ScanFrequency>())})");
    }
}

public static class TechHealthValidatorHelpers
{
    internal static bool BeValidHttpUrl(string? url)
    {
        if (string.IsNullOrEmpty(url)) return true;
        return Uri.TryCreate(url, UriKind.Absolute, out Uri? result)
            && (result.Scheme == Uri.UriSchemeHttp || result.Scheme == Uri.UriSchemeHttps);
    }
}
