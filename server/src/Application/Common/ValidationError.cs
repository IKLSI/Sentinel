namespace Sentinel.Application.Common;

public sealed record ValidationError(
    string Identifier,
    string Code,
    IReadOnlyDictionary<string, string>? Params = null);
