namespace Sentinel.Application.Services;

public abstract class TranslatableException : Exception
{
    protected TranslatableException(string code, IReadOnlyDictionary<string, string>? parameters = null)
        : base(code)
    {
        Code = code;
        Params = parameters;
    }

    public string Code { get; }
    public IReadOnlyDictionary<string, string>? Params { get; }
}
