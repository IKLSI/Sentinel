using Sentinel.Domain.Entities;

namespace Sentinel.Application.Remediation;

public static class RemediationMapper
{
    public static RemediationDto ToDto(VulnerabilityRemediation remediation) => new()
    {
        Id = remediation.Id,
        Status = remediation.Status.ToString(),
        MergeRequestUrl = remediation.MergeRequestUrl,
        FailureCode = remediation.FailureCode,
        CreatedAt = remediation.CreatedAt,
        UpdatedAt = remediation.UpdatedAt
    };
}
