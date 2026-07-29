using FluentValidation;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Tickets;

namespace Sentinel.Application.Validators;

public class CreateTicketDtoValidator : AbstractValidator<CreateTicketDto>
{
    public CreateTicketDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage(ValidationCodes.TicketTitleRequired)
            .MaximumLength(500).WithMessage(ValidationCodes.TicketTitleMaxLength);

        RuleFor(x => x.Description)
            .MaximumLength(10000).WithMessage(ValidationCodes.TicketDescriptionMaxLength);

        RuleFor(x => x.Priority).IsInEnum().WithMessage(ValidationCodes.TicketPriorityInvalid);
        RuleFor(x => x.Type).IsInEnum().WithMessage(ValidationCodes.TicketTypeInvalid);

        RuleFor(x => x.EstimatedHours)
            .GreaterThanOrEqualTo(0).WithMessage(ValidationCodes.TicketEstimatedHoursMin)
            .LessThanOrEqualTo(10000).WithMessage(ValidationCodes.TicketEstimatedHoursMax)
            .When(x => x.EstimatedHours.HasValue);

        RuleForEach(x => x.Tags)
            .NotEmpty().WithMessage(ValidationCodes.TicketTagEmpty)
            .MaximumLength(50).WithMessage(ValidationCodes.TicketTagMaxLength);

        RuleFor(x => x.Tags.Count).LessThanOrEqualTo(20).WithMessage(ValidationCodes.TicketTagsMaxCount);
    }
}

public class UpdateTicketDtoValidator : AbstractValidator<UpdateTicketDto>
{
    public UpdateTicketDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage(ValidationCodes.TicketTitleRequired)
            .MaximumLength(500).WithMessage(ValidationCodes.TicketTitleMaxLength)
            .When(x => x.Title != null);

        RuleFor(x => x.Description)
            .MaximumLength(10000).WithMessage(ValidationCodes.TicketDescriptionMaxLength)
            .When(x => x.Description != null);

        RuleFor(x => x.Priority).IsInEnum().WithMessage(ValidationCodes.TicketPriorityInvalid)
            .When(x => x.Priority.HasValue);
        RuleFor(x => x.Type).IsInEnum().WithMessage(ValidationCodes.TicketTypeInvalid)
            .When(x => x.Type.HasValue);

        RuleFor(x => x.EstimatedHours)
            .GreaterThanOrEqualTo(0).WithMessage(ValidationCodes.TicketEstimatedHoursMin)
            .LessThanOrEqualTo(10000).WithMessage(ValidationCodes.TicketEstimatedHoursMax)
            .When(x => x.EstimatedHours.HasValue);

        When(x => x.Tags != null, () =>
        {
            RuleForEach(x => x.Tags!)
                .NotEmpty().WithMessage(ValidationCodes.TicketTagEmpty)
                .MaximumLength(50).WithMessage(ValidationCodes.TicketTagMaxLength);
            RuleFor(x => x.Tags!.Count).LessThanOrEqualTo(20).WithMessage(ValidationCodes.TicketTagsMaxCount);
        });
    }
}

public class CreateCommentDtoValidator : AbstractValidator<CreateCommentDto>
{
    public CreateCommentDtoValidator()
    {
        RuleFor(x => x.Content)
            .NotEmpty().WithMessage(ValidationCodes.TicketCommentRequired)
            .MaximumLength(5000).WithMessage(ValidationCodes.TicketCommentMaxLength);
    }
}

public class ChangeStatusDtoValidator : AbstractValidator<ChangeStatusDto>
{
    public ChangeStatusDtoValidator()
    {
        RuleFor(x => x.StatusId)
            .NotEmpty().WithMessage(ValidationCodes.TicketStatusRequired);
    }
}
