using FluentValidation;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Users;
using Sentinel.Domain.Models;

namespace Sentinel.Application.Validators;

public class CreateUserDtoValidator : AbstractValidator<CreateUserDto>
{
    public CreateUserDtoValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage(ValidationCodes.EmailRequired)
            .EmailAddress().WithMessage(ValidationCodes.EmailInvalidFormat)
            .MaximumLength(254).WithMessage(ValidationCodes.MaxLength);

        RuleFor(x => x.Role)
            .NotEmpty().WithMessage(ValidationCodes.RoleRequired)
            .Must(r => Enum.TryParse<UserRole>(r, out _))
            .WithMessage(ValidationCodes.RoleInvalid);
    }
}

public class AcceptInvitationDtoValidator : AbstractValidator<AcceptInvitationDto>
{
    public AcceptInvitationDtoValidator()
    {
        RuleFor(x => x.Token)
            .NotEmpty().WithMessage(ValidationCodes.TokenRequired)
            .MaximumLength(200).WithMessage(ValidationCodes.MaxLength);

        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage(ValidationCodes.FirstNameRequired)
            .MaximumLength(100).WithMessage(ValidationCodes.MaxLength);

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage(ValidationCodes.LastNameRequired)
            .MaximumLength(100).WithMessage(ValidationCodes.MaxLength);

        RuleFor(x => x.Password).StrongPassword();
    }
}

public class UpdateUserDtoValidator : AbstractValidator<UpdateUserDto>
{
    public UpdateUserDtoValidator()
    {
        RuleFor(x => x.FirstName).MaximumLength(100).WithMessage(ValidationCodes.MaxLength)
            .When(x => x.FirstName != null);
        RuleFor(x => x.LastName).MaximumLength(100).WithMessage(ValidationCodes.MaxLength)
            .When(x => x.LastName != null);
        RuleFor(x => x.Role)
            .Must(r => Enum.TryParse<UserRole>(r, out _))
            .WithMessage(ValidationCodes.RoleInvalid)
            .When(x => !string.IsNullOrEmpty(x.Role));
    }
}

public class UpdatePreferencesDtoValidator : AbstractValidator<UpdatePreferencesDto>
{
    public UpdatePreferencesDtoValidator()
    {
        RuleFor(x => x.Theme)
            .Must(t => Enum.TryParse<ThemeType>(t, ignoreCase: true, out _))
            .WithMessage(ValidationCodes.ThemeInvalid)
            .When(x => !string.IsNullOrEmpty(x.Theme));
    }
}

public class UpdateMyProfileDtoValidator : AbstractValidator<UpdateMyProfileDto>
{
    public UpdateMyProfileDtoValidator()
    {
        RuleFor(x => x.FirstName).MaximumLength(100).WithMessage(ValidationCodes.MaxLength)
            .When(x => x.FirstName != null);
        RuleFor(x => x.LastName).MaximumLength(100).WithMessage(ValidationCodes.MaxLength)
            .When(x => x.LastName != null);
    }
}
