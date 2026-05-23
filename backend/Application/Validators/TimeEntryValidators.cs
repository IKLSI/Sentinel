using FluentValidation;
using Sentinel.Domain.DTOs.TimeEntries;

namespace Sentinel.Application.Validators;

public class CreateTimeEntryDtoValidator : AbstractValidator<CreateTimeEntryDto>
{
    public CreateTimeEntryDtoValidator()
    {
        RuleFor(x => x.Date)
            .NotEmpty().WithMessage("La date est requise")
            .LessThanOrEqualTo(_ => DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)))
            .WithMessage("La date ne peut pas être dans le futur");

        RuleFor(x => x.DurationMinutes)
            .InclusiveBetween(1, 1440)
            .WithMessage("La durée doit être entre 1 et 1440 minutes");

        RuleFor(x => x.Title).MaximumLength(500).When(x => x.Title != null);
        RuleFor(x => x.Description).MaximumLength(2000).When(x => x.Description != null);

        RuleFor(x => x)
            .Must(x => x.TicketId.HasValue || x.TechProjectId.HasValue)
            .WithMessage("Un ticket ou un projet technique doit être associé");

        RuleFor(x => x)
            .Must(x => !x.StartTime.HasValue || !x.EndTime.HasValue || x.EndTime > x.StartTime)
            .WithMessage("L'heure de fin doit être après l'heure de début")
            .When(x => x.StartTime.HasValue && x.EndTime.HasValue);
    }
}

public class UpdateTimeEntryDtoValidator : AbstractValidator<UpdateTimeEntryDto>
{
    public UpdateTimeEntryDtoValidator()
    {
        RuleFor(x => x.Date)
            .LessThanOrEqualTo(_ => DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)))
            .WithMessage("La date ne peut pas être dans le futur")
            .When(x => x.Date.HasValue);

        RuleFor(x => x.DurationMinutes)
            .InclusiveBetween(1, 1440)
            .WithMessage("La durée doit être entre 1 et 1440 minutes")
            .When(x => x.DurationMinutes.HasValue);

        RuleFor(x => x.Title).MaximumLength(500).When(x => x.Title != null);
        RuleFor(x => x.Description).MaximumLength(2000).When(x => x.Description != null);

        RuleFor(x => x)
            .Must(x => !x.StartTime.HasValue || !x.EndTime.HasValue || x.EndTime > x.StartTime)
            .WithMessage("L'heure de fin doit être après l'heure de début")
            .When(x => x.StartTime.HasValue && x.EndTime.HasValue);
    }
}
