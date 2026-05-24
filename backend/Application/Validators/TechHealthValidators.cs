using FluentValidation;
using Sentinel.Domain.DTOs.TechHealth;

namespace Sentinel.Application.Validators;

public class CreateTechProjectDtoValidator : AbstractValidator<CreateTechProjectDto>
{
    public CreateTechProjectDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Le nom du projet est requis")
            .MaximumLength(200).WithMessage("Le nom ne peut pas dépasser 200 caractères");

        RuleFor(x => x.RepositoryUrl)
            .MaximumLength(500)
            .Must(BeValidHttpUrl).WithMessage("URL de dépôt invalide")
            .When(x => !string.IsNullOrEmpty(x.RepositoryUrl));

        RuleFor(x => x.RepositoryType)
            .NotEmpty()
            .MaximumLength(50)
            .Must(t => t is "GitHub" or "GitLab" or "Bitbucket")
            .WithMessage("Type de dépôt invalide (GitHub, GitLab ou Bitbucket)");

        RuleFor(x => x.ScanFrequency)
            .NotEmpty()
            .MaximumLength(50)
            .Must(f => f is "Daily" or "Weekly" or "Monthly" or "Manual")
            .WithMessage("Fréquence invalide (Daily, Weekly, Monthly ou Manual)");
    }

    internal static bool BeValidHttpUrl(string? url)
    {
        if (string.IsNullOrEmpty(url)) return true;
        return Uri.TryCreate(url, UriKind.Absolute, out Uri? result)
            && (result.Scheme == Uri.UriSchemeHttp || result.Scheme == Uri.UriSchemeHttps);
    }
}
