using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Tickets;
using Sentinel.Domain.Models;

namespace Sentinel.Application.Tickets.ChangeStatus;

public class TicketChangeStatusValidator : IValidator
{
    public Task<Result> ValidateAsync(ChangeStatusDto model, CancellationToken cancellationToken)
    {
        ValidationErrors errors = new ValidationErrors()
            .Required(nameof(model.Status), model.Status, ValidationCodes.TicketStatusRequired)
            .ParsableEnum<TicketStatus>(nameof(model.Status), model.Status, ValidationCodes.TicketStatusInvalid);

        return Task.FromResult(errors.ToResult());
    }
}
