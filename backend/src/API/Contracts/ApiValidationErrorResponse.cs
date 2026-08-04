namespace Sentinel.API.Contracts;

public class ApiValidationErrorResponse : ApiErrorResponse
{
    public required IReadOnlyDictionary<string, ValidationErrorItem[]> Errors { get; init; }
}
