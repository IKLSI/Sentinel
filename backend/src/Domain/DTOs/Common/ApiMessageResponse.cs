using System.Text.Json.Serialization;

namespace Sentinel.Domain.DTOs.Common;

public class ApiMessageResponse
{
    public required string Code { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyDictionary<string, string>? Params { get; init; }

    public static ApiMessageResponse Create(string code) => new() { Code = code };

    public static ApiMessageResponse Create(string code, IReadOnlyDictionary<string, string> parameters) =>
        new() { Code = code, Params = parameters };
}
