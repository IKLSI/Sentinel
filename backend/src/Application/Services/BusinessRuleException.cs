using System.Net;

namespace Sentinel.Application.Services;

public class BusinessRuleException : TranslatableException
{
    public BusinessRuleException(string code,
        IReadOnlyDictionary<string, string>? parameters = null,
        HttpStatusCode statusCode = HttpStatusCode.BadRequest)
        : base(code, parameters)
    {
        StatusCode = statusCode;
    }

    public HttpStatusCode StatusCode { get; }
}
