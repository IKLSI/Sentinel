using FluentValidation;
using Sentinel.Domain.DTOs.Tickets;

namespace Sentinel.Application.Validators;

public class CreateTicketDtoValidator : AbstractValidator<CreateTicketDto>
{
    public CreateTicketDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Le titre est requis")
            .MaximumLength(500).WithMessage("Le titre ne peut pas dépasser 500 caractères");

        RuleFor(x => x.Description)
            .MaximumLength(10000).WithMessage("La description ne peut pas dépasser 10000 caractères");

        RuleFor(x => x.Priority).IsInEnum().WithMessage("Priorité invalide");
        RuleFor(x => x.Type).IsInEnum().WithMessage("Type invalide");

        RuleFor(x => x.EstimatedHours)
            .GreaterThanOrEqualTo(0).WithMessage("L'estimation doit être positive")
            .LessThanOrEqualTo(10000).WithMessage("L'estimation est trop grande")
            .When(x => x.EstimatedHours.HasValue);

        RuleForEach(x => x.Tags)
            .NotEmpty().WithMessage("Tag vide non autorisé")
            .MaximumLength(50).WithMessage("Tag trop long (max 50 caractères)");

        RuleFor(x => x.Tags.Count).LessThanOrEqualTo(20).WithMessage("Maximum 20 tags");
    }
}

public class UpdateTicketDtoValidator : AbstractValidator<UpdateTicketDto>
{
    public UpdateTicketDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Le titre ne peut pas être vide")
            .MaximumLength(500).WithMessage("Le titre ne peut pas dépasser 500 caractères")
            .When(x => x.Title != null);

        RuleFor(x => x.Description)
            .MaximumLength(10000).WithMessage("La description ne peut pas dépasser 10000 caractères")
            .When(x => x.Description != null);

        RuleFor(x => x.Priority).IsInEnum().When(x => x.Priority.HasValue);
        RuleFor(x => x.Type).IsInEnum().When(x => x.Type.HasValue);

        RuleFor(x => x.EstimatedHours)
            .GreaterThanOrEqualTo(0).WithMessage("L'estimation doit être positive")
            .LessThanOrEqualTo(10000).WithMessage("L'estimation est trop grande")
            .When(x => x.EstimatedHours.HasValue);

        When(x => x.Tags != null, () =>
        {
            RuleForEach(x => x.Tags!)
                .NotEmpty().WithMessage("Tag vide non autorisé")
                .MaximumLength(50).WithMessage("Tag trop long");
            RuleFor(x => x.Tags!.Count).LessThanOrEqualTo(20).WithMessage("Maximum 20 tags");
        });
    }
}

public class CreateCommentDtoValidator : AbstractValidator<CreateCommentDto>
{
    public CreateCommentDtoValidator()
    {
        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Le commentaire est requis")
            .MaximumLength(5000).WithMessage("Le commentaire ne peut pas dépasser 5000 caractères");
    }
}

public class ChangeStatusDtoValidator : AbstractValidator<ChangeStatusDto>
{
    public ChangeStatusDtoValidator()
    {
        RuleFor(x => x.StatusId)
            .NotEmpty().WithMessage("Le statut est requis");
    }
}
