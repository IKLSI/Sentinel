namespace Sentinel.Application.ApiKeys.Validate;

public class ApiKeyPrincipalDto
{
    public required Guid ApiKeyId { get; init; }
    public required Guid UserId { get; init; }
    public required string Email { get; init; }
    public required string Role { get; init; }
    public required Guid OrganizationId { get; init; }
}
