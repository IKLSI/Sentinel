using Sentinel.Domain.Entities;

namespace Sentinel.Application.TechHealth.Remediation;

public static class RemediationMapper
{
    public static RemediationDto ToDto(VulnerabilityRemediation remediation) => new()
    {
        Id = remediation.Id,
        Status = remediation.Status.ToString(),
        TargetVersion = remediation.TargetVersion,
        MergeRequestUrl = remediation.MergeRequestUrl,
        FailureCode = remediation.FailureCode,
        CreatedAt = remediation.CreatedAt,
        UpdatedAt = remediation.UpdatedAt
    };
}
