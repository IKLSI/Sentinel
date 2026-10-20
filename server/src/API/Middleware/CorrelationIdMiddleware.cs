using Serilog.Context;

namespace Sentinel.API.Middleware;

public class CorrelationIdMiddleware
{
    internal const string HeaderName = "X-Correlation-Id";
    private const int MaxCorrelationIdLength = 64;
    private readonly RequestDelegate _next;

    public CorrelationIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        string correlationId = context.Request.Headers.TryGetValue(HeaderName, out Microsoft.Extensions.Primitives.StringValues value)
            && IsValidCorrelationId(value.ToString())
                ? value.ToString()
                : Guid.NewGuid().ToString();

        context.Response.OnStarting(() =>
        {
            if (!context.Response.Headers.ContainsKey(HeaderName))
            {
                context.Response.Headers[HeaderName] = correlationId;
            }

            return Task.CompletedTask;
        });

        context.Items[HeaderName] = correlationId;

        using (LogContext.PushProperty("CorrelationId", correlationId))
        using (LogContext.PushProperty("RequestPath", context.Request.Path.Value))
        {
            await _next(context);
        }
    }

    private static bool IsValidCorrelationId(string value) =>
        value.Length is > 0 and <= MaxCorrelationIdLength
        && value.All(c => char.IsAsciiLetterOrDigit(c) || c is '-' or '_' or '.');
}
