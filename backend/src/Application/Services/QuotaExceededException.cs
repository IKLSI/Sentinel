namespace Sentinel.Application.Services;

public class QuotaExceededException : TranslatableException
{
    public QuotaExceededException(string code, IReadOnlyDictionary<string, string>? parameters = null)
        : base(code, parameters) { }
}
