using FluentValidation;
using Sentinel.Domain.DTOs.Auth;

namespace Sentinel.Application.Validators;

internal static class PasswordRules
{
    public static IRuleBuilderOptions<T, string> StrongPassword<T>(this IRuleBuilder<T, string> rb) =>
        rb.NotEmpty().WithMessage("Le mot de passe est requis")
          .MinimumLength(12).WithMessage("Le mot de passe doit contenir au moins 12 caractères")
          .MaximumLength(128).WithMessage("Le mot de passe ne peut pas dépasser 128 caractères")
          .Matches("[a-z]").WithMessage("Le mot de passe doit contenir une minuscule")
          .Matches("[A-Z]").WithMessage("Le mot de passe doit contenir une majuscule")
          .Matches("\\d").WithMessage("Le mot de passe doit contenir un chiffre")
          .Matches("[^A-Za-z0-9]").WithMessage("Le mot de passe doit contenir un caractère spécial");
}

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("L'email est requis")
            .EmailAddress().WithMessage("Format d'email invalide")
            .MaximumLength(254);

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Le mot de passe est requis")
            .MaximumLength(128);
    }
}

public class ForgotPasswordRequestValidator : AbstractValidator<ForgotPasswordRequest>
{
    public ForgotPasswordRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("L'email est requis")
            .EmailAddress().WithMessage("Format d'email invalide")
            .MaximumLength(254);
    }
}

public class RefreshTokenRequestValidator : AbstractValidator<RefreshTokenRequest>
{
    public RefreshTokenRequestValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("Le refresh token est requis")
            .MaximumLength(500);
    }
}

public class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordRequestValidator()
    {
        RuleFor(x => x.Token)
            .NotEmpty().WithMessage("Le token est requis")
            .MaximumLength(200);

        RuleFor(x => x.Password).StrongPassword();
    }
}

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("L'email est requis")
            .EmailAddress().WithMessage("Format d'email invalide")
            .MaximumLength(254);

        RuleFor(x => x.Password).StrongPassword();

        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("Le prénom est requis")
            .MaximumLength(100);

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Le nom est requis")
            .MaximumLength(100);

        RuleFor(x => x.OrganizationName)
            .NotEmpty().WithMessage("Le nom de l'organisation est requis")
            .MinimumLength(2).WithMessage("Le nom de l'organisation doit contenir au moins 2 caractères")
            .MaximumLength(200);
    }
}

public class VerifyEmailRequestValidator : AbstractValidator<VerifyEmailRequest>
{
    public VerifyEmailRequestValidator()
    {
        RuleFor(x => x.Token)
            .NotEmpty().WithMessage("Le token est requis")
            .MaximumLength(200);
    }
}

public class ResendVerificationRequestValidator : AbstractValidator<ResendVerificationRequest>
{
    public ResendVerificationRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("L'email est requis")
            .EmailAddress().WithMessage("Format d'email invalide")
            .MaximumLength(254);
    }
}
