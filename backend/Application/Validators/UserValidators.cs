using FluentValidation;
using Sentinel.Domain.DTOs.Users;
using Sentinel.Domain.Models;

namespace Sentinel.Application.Validators;

public class CreateUserDtoValidator : AbstractValidator<CreateUserDto>
{
    public CreateUserDtoValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("L'email est requis")
            .EmailAddress().WithMessage("Format d'email invalide")
            .MaximumLength(254);

        RuleFor(x => x.Role)
            .NotEmpty().WithMessage("Le rôle est requis")
            .Must(r => Enum.TryParse<UserRole>(r, out _))
            .WithMessage("Rôle invalide (Admin ou Developer)");
    }
}

public class AcceptInvitationDtoValidator : AbstractValidator<AcceptInvitationDto>
{
    public AcceptInvitationDtoValidator()
    {
        RuleFor(x => x.Token)
            .NotEmpty().WithMessage("Le token est requis")
            .MaximumLength(200);

        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("Le prénom est requis")
            .MaximumLength(100);

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Le nom est requis")
            .MaximumLength(100);

        RuleFor(x => x.Password).StrongPassword();
    }
}

public class UpdateUserDtoValidator : AbstractValidator<UpdateUserDto>
{
    public UpdateUserDtoValidator()
    {
        RuleFor(x => x.FirstName).MaximumLength(100).When(x => x.FirstName != null);
        RuleFor(x => x.LastName).MaximumLength(100).When(x => x.LastName != null);
        RuleFor(x => x.Role)
            .Must(r => Enum.TryParse<UserRole>(r, out _))
            .WithMessage("Rôle invalide")
            .When(x => !string.IsNullOrEmpty(x.Role));
    }
}

public class UpdatePreferencesDtoValidator : AbstractValidator<UpdatePreferencesDto>
{
    public UpdatePreferencesDtoValidator()
    {
        RuleFor(x => x.Theme)
            .Must(t => Enum.TryParse<ThemeType>(t, ignoreCase: true, out _))
            .WithMessage($"Thème invalide ({ThemeType.Light.ToString().ToLower()} ou {ThemeType.Dark.ToString().ToLower()})")
            .When(x => !string.IsNullOrEmpty(x.Theme));
    }
}

public class UpdateMyProfileDtoValidator : AbstractValidator<UpdateMyProfileDto>
{
    public UpdateMyProfileDtoValidator()
    {
        RuleFor(x => x.FirstName).MaximumLength(100).When(x => x.FirstName != null);
        RuleFor(x => x.LastName).MaximumLength(100).When(x => x.LastName != null);
    }
}

public class ChangePasswordDtoValidator : AbstractValidator<ChangePasswordDto>
{
    public ChangePasswordDtoValidator()
    {
        RuleFor(x => x.CurrentPassword)
            .NotEmpty().WithMessage("L'ancien mot de passe est requis")
            .MaximumLength(128);

        RuleFor(x => x.NewPassword).StrongPassword();

        RuleFor(x => x.NewPassword)
            .NotEqual(x => x.CurrentPassword)
            .WithMessage("Le nouveau mot de passe doit être différent de l'ancien");
    }
}
