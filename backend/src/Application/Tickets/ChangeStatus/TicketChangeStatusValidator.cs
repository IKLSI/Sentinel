using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Tickets;

namespace Sentinel.Application.Tickets.ChangeStatus;

public class TicketChangeStatusValidator : IValidator
{
    public Task<Result> ValidateAsync(ChangeStatusDto model, CancellationToken cancellationToken)
    {
        ValidationErrors errors = new ValidationErrors()
            .Required(nameof(model.StatusId), model.StatusId, ValidationCodes.TicketStatusRequired);

        return Task.FromResult(errors.ToResult());
    }
}
