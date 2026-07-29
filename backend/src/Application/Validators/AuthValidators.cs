using FluentValidation;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Auth;

namespace Sentinel.Application.Validators;

internal static class PasswordRules
{
    public static IRuleBuilderOptions<T, string> StrongPassword<T>(this IRuleBuilder<T, string> rb) =>
        rb.NotEmpty().WithMessage(ValidationCodes.PasswordRequired)
          .MinimumLength(12).WithMessage(ValidationCodes.PasswordMinLength)
          .MaximumLength(128).WithMessage(ValidationCodes.PasswordMaxLength)
          .Matches("[a-z]").WithMessage(ValidationCodes.PasswordLowercase)
          .Matches("[A-Z]").WithMessage(ValidationCodes.PasswordUppercase)
          .Matches("\\d").WithMessage(ValidationCodes.PasswordDigit)
          .Matches("[^A-Za-z0-9]").WithMessage(ValidationCodes.PasswordSpecialCharacter);
}

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage(ValidationCodes.EmailRequired)
            .EmailAddress().WithMessage(ValidationCodes.EmailInvalidFormat)
            .MaximumLength(254).WithMessage(ValidationCodes.MaxLength);

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage(ValidationCodes.PasswordRequired)
            .MaximumLength(128).WithMessage(ValidationCodes.PasswordMaxLength);
    }
}

public class ForgotPasswordRequestValidator : AbstractValidator<ForgotPasswordRequest>
{
    public ForgotPasswordRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage(ValidationCodes.EmailRequired)
            .EmailAddress().WithMessage(ValidationCodes.EmailInvalidFormat)
            .MaximumLength(254).WithMessage(ValidationCodes.MaxLength);
    }
}

public class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordRequestValidator()
    {
        RuleFor(x => x.Token)
            .NotEmpty().WithMessage(ValidationCodes.TokenRequired)
            .MaximumLength(200).WithMessage(ValidationCodes.MaxLength);

        RuleFor(x => x.Password).StrongPassword();
    }
}

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage(ValidationCodes.EmailRequired)
            .EmailAddress().WithMessage(ValidationCodes.EmailInvalidFormat)
            .MaximumLength(254).WithMessage(ValidationCodes.MaxLength);

        RuleFor(x => x.Password).StrongPassword();

        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage(ValidationCodes.FirstNameRequired)
            .MaximumLength(100).WithMessage(ValidationCodes.MaxLength);

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage(ValidationCodes.LastNameRequired)
            .MaximumLength(100).WithMessage(ValidationCodes.MaxLength);

        RuleFor(x => x.OrganizationName)
            .NotEmpty().WithMessage(ValidationCodes.OrganizationNameRequired)
            .MinimumLength(2).WithMessage(ValidationCodes.OrganizationNameMinLength)
            .MaximumLength(200).WithMessage(ValidationCodes.OrganizationNameMaxLength);
    }
}

public class VerifyEmailRequestValidator : AbstractValidator<VerifyEmailRequest>
{
    public VerifyEmailRequestValidator()
    {
        RuleFor(x => x.Token)
            .NotEmpty().WithMessage(ValidationCodes.TokenRequired)
            .MaximumLength(200).WithMessage(ValidationCodes.MaxLength);
    }
}

public class ResendVerificationRequestValidator : AbstractValidator<ResendVerificationRequest>
{
    public ResendVerificationRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage(ValidationCodes.EmailRequired)
            .EmailAddress().WithMessage(ValidationCodes.EmailInvalidFormat)
            .MaximumLength(254).WithMessage(ValidationCodes.MaxLength);
    }
}
