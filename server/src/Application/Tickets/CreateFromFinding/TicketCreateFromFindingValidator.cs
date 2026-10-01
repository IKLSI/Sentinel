using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;

namespace Sentinel.Application.Tickets.CreateFromFinding;

public class TicketCreateFromFindingValidator : IValidator
{
    public const int FindingKeyMaxLength = 500;

    public Task<Result> ValidateAsync(CreateTicketFromFindingRequest model, CancellationToken cancellationToken)
    {
        ValidationErrors errors = new ValidationErrors()
            .Required(nameof(model.ProjectId), model.ProjectId, ValidationCodes.TicketProjectRequired)
            .DefinedEnum(nameof(model.Kind), model.Kind, ValidationCodes.TicketFindingKindInvalid)
            .Required(nameof(model.FindingKey), model.FindingKey, ValidationCodes.TicketFindingKeyRequired)
            .MaxLength(nameof(model.FindingKey), model.FindingKey, FindingKeyMaxLength,
                ValidationCodes.TicketFindingKeyMaxLength);

        return Task.FromResult(errors.ToResult());
    }
}
