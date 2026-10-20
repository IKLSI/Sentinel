using Sentinel.Domain.Entities;

namespace Sentinel.Application.TechHealth.Suppressions;

public static class SuppressionMapper
{
    public static SuppressionDto ToDto(VulnerabilitySuppression suppression) => new()
    {
        Id = suppression.Id,
        FindingKey = suppression.FindingKey,
        Reason = suppression.Reason.ToString(),
        Justification = suppression.Justification,
        CreatedAt = suppression.CreatedAt,
        ExpiresAt = suppression.ExpiresAt
    };
}
