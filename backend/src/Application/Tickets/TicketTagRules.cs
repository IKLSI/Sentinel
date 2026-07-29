using Sentinel.Application.Common;
using Sentinel.Domain.Constants;

namespace Sentinel.Application.Tickets;

public static class TicketTagRules
{
    private const int TagMaxLength = 50;

    public static void Apply(ValidationErrors errors, string identifier, IReadOnlyCollection<string>? tags)
    {
        if (tags == null) return;

        foreach (string tag in tags)
        {
            errors
                .Required(identifier, tag, ValidationCodes.TicketTagEmpty)
                .MaxLength(identifier, tag, TagMaxLength, ValidationCodes.TicketTagMaxLength);
        }
    }
}
