using System.Text.Json.Serialization;

namespace Sentinel.Application.Common.Contracts;

public class ApiMessageResponse
{
    public required string Code { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyDictionary<string, string>? Params { get; init; }

    public static ApiMessageResponse Create(string code) => new() { Code = code };
}
