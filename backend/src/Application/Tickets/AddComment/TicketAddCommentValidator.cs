using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;

namespace Sentinel.Application.Tickets.AddComment;

public class TicketAddCommentValidator : IValidator
{
    public Task<Result> ValidateAsync(CreateCommentDto model, CancellationToken cancellationToken)
    {
        ValidationErrors errors = new ValidationErrors()
            .Required(nameof(model.Content), model.Content, ValidationCodes.TicketCommentRequired)
            .MaxLength(nameof(model.Content), model.Content, 5000, ValidationCodes.TicketCommentMaxLength);

        return Task.FromResult(errors.ToResult());
    }
}
