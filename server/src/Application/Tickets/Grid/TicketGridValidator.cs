using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;

namespace Sentinel.Application.Tickets.Grid;

public class TicketGridValidator : IValidator
{
    public Task<Result> ValidateAsync(TicketGridModel model, CancellationToken cancellationToken)
    {
        if (model.Search?.Length > TicketGridModel.SearchMaxLength)
        {
            return Task.FromResult(Result.Error(
                ErrorCodes.TicketSearchTooLong,
                new Dictionary<string, string> { ["maxLength"] = TicketGridModel.SearchMaxLength.ToString() }));
        }

        return Task.FromResult(Result.Success());
    }
}
