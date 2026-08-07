using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;

namespace Sentinel.Application.Tickets.Grid;

public class TicketGridValidator : IValidator
{
    public Task<Result> ValidateAsync(TicketGridModel model, CancellationToken cancellationToken) =>
        Task.FromResult(TicketFilterParser.Validate(model));
}
