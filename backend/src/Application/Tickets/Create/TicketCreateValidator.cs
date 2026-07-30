using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Tickets;

namespace Sentinel.Application.Tickets.Create;

public class TicketCreateValidator : IValidator
{
    public Task<Result> ValidateAsync(CreateTicketDto model, CancellationToken cancellationToken)
    {
        ValidationErrors errors = new ValidationErrors()
            .Required(nameof(model.Title), model.Title, ValidationCodes.TicketTitleRequired)
            .MaxLength(nameof(model.Title), model.Title, 500, ValidationCodes.TicketTitleMaxLength)
            .MaxLength(nameof(model.Description), model.Description, 10000,
                ValidationCodes.TicketDescriptionMaxLength)
            .DefinedEnum(nameof(model.Priority), model.Priority, ValidationCodes.TicketPriorityInvalid)
            .DefinedEnum(nameof(model.Type), model.Type, ValidationCodes.TicketTypeInvalid)
            .InRange(nameof(model.EstimatedHours), (decimal?)model.EstimatedHours, 0, 10000,
                ValidationCodes.TicketEstimatedHoursMin, ValidationCodes.TicketEstimatedHoursMax);

        return Task.FromResult(errors.ToResult());
    }
}
