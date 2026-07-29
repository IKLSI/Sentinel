namespace Sentinel.Application.Services;

public class ResourceNotFoundException : TranslatableException
{
    public ResourceNotFoundException(string code, IReadOnlyDictionary<string, string>? parameters = null)
        : base(code, parameters) { }
}
