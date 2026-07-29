using System.Text.Json.Serialization;

namespace Sentinel.Domain.DTOs.Common;

public class ApiErrorResponse
{
    public required string Code { get; init; }
    public int Status { get; init; }
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyDictionary<string, string>? Params { get; init; }

    public static ApiErrorResponse Create(string code, int status) =>
        new() { Code = code, Status = status };

    public static ApiErrorResponse Create(string code, int status, IReadOnlyDictionary<string, string> parameters) =>
        new() { Code = code, Status = status, Params = parameters };
}
