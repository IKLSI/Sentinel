namespace Sentinel.Application.Common.Contracts;

public class ApiValidationErrorResponse : ApiErrorResponse
{
    public required IReadOnlyDictionary<string, ValidationErrorItem[]> Errors { get; init; }
}
