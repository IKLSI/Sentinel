using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Tickets;
using Sentinel.Domain.Models;

namespace Sentinel.Application.Tickets.Update;

public class TicketUpdateValidator : IValidator
{
    public Task<Result> ValidateAsync(UpdateTicketDto model, CancellationToken cancellationToken)
    {
        ValidationErrors errors = new ValidationErrors();

        if (model.Title != null)
        {
            errors
                .Required(nameof(model.Title), model.Title, ValidationCodes.TicketTitleRequired)
                .MaxLength(nameof(model.Title), model.Title, 500, ValidationCodes.TicketTitleMaxLength);
        }

        if (model.Description != null)
            errors.MaxLength(nameof(model.Description), model.Description, 10000,
                ValidationCodes.TicketDescriptionMaxLength);

        if (model.Priority.HasValue)
            errors.DefinedEnum(nameof(model.Priority), model.Priority.Value,
                ValidationCodes.TicketPriorityInvalid);

        if (model.Type.HasValue)
            errors.DefinedEnum(nameof(model.Type), model.Type.Value, ValidationCodes.TicketTypeInvalid);

        if (model.Status != null)
            errors.ParsableEnum<TicketStatus>(nameof(model.Status), model.Status, ValidationCodes.TicketStatusInvalid);

        errors.InRange(nameof(model.EstimatedHours), (decimal?)model.EstimatedHours, 0, 10000,
            ValidationCodes.TicketEstimatedHoursMin, ValidationCodes.TicketEstimatedHoursMax);

        return Task.FromResult(errors.ToResult());
    }
}
