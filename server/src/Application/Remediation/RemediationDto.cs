using Sentinel.Application.Common.Contracts;
using Sentinel.Domain.Entities;
namespace Sentinel.Application.Remediation;

public class RemediationDto
{
    public Guid Id { get; set; }
    [EnumValues(typeof(RemediationStatus))]
    public string Status { get; set; } = string.Empty;
    public string? MergeRequestUrl { get; set; }
    public string? FailureCode { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
