using System.Text.Json.Serialization;

namespace Sentinel.Domain.DTOs.Common;

public class ValidationErrorItem
{
    public required string Code { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyDictionary<string, string>? Params { get; init; }
}
