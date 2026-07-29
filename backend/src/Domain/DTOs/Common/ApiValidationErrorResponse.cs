namespace Sentinel.Domain.DTOs.Common;

public class ApiValidationErrorResponse : ApiErrorResponse
{
    public required IReadOnlyDictionary<string, ValidationErrorItem[]> Errors { get; init; }
}
