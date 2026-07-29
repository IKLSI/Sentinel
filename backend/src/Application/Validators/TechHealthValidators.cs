using FluentValidation;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.TechHealth;
using Sentinel.Domain.Models;

namespace Sentinel.Application.Validators;

public class CreateProjectDtoValidator : AbstractValidator<CreateProjectDto>
{
    public CreateProjectDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage(ValidationCodes.ProjectNameRequired)
            .MaximumLength(200).WithMessage(ValidationCodes.ProjectNameMaxLength);

        RuleFor(x => x.RepositoryUrl)
            .MaximumLength(500).WithMessage(ValidationCodes.MaxLength)
            .Must(TechHealthValidatorHelpers.BeValidHttpUrl).WithMessage(ValidationCodes.ProjectRepositoryUrlInvalid)
            .When(x => !string.IsNullOrEmpty(x.RepositoryUrl));

        RuleFor(x => x.RepositoryType)
            .NotEmpty().WithMessage(ValidationCodes.ProjectRepositoryTypeInvalid)
            .MaximumLength(50).WithMessage(ValidationCodes.MaxLength)
            .Must(t => Enum.TryParse<RepositoryType>(t, out _))
            .WithMessage(ValidationCodes.ProjectRepositoryTypeInvalid);

        RuleFor(x => x.ScanFrequency)
            .NotEmpty().WithMessage(ValidationCodes.ProjectScanFrequencyInvalid)
            .MaximumLength(50).WithMessage(ValidationCodes.MaxLength)
            .Must(f => Enum.TryParse<ScanFrequency>(f, out _))
            .WithMessage(ValidationCodes.ProjectScanFrequencyInvalid);

    }

}

public class UpdateProjectDtoValidator : AbstractValidator<UpdateProjectDto>
{
    public UpdateProjectDtoValidator()
    {
        RuleFor(x => x.ScanFrequency)
            .NotEmpty().WithMessage(ValidationCodes.ProjectScanFrequencyInvalid)
            .MaximumLength(50).WithMessage(ValidationCodes.MaxLength)
            .Must(f => Enum.TryParse<ScanFrequency>(f, out _))
            .WithMessage(ValidationCodes.ProjectScanFrequencyInvalid);
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
