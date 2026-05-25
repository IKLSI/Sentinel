using System.Security.Cryptography;

namespace Sentinel.API.Middleware;

public class ETagMiddleware
{
    private readonly RequestDelegate _next;

    public ETagMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!HttpMethods.IsGet(context.Request.Method))
        {
            await _next(context);
            return;
        }

        Stream originalBody = context.Response.Body;
        using MemoryStream buffer = new();
        context.Response.Body = buffer;

        await _next(context);

        if (context.Response.StatusCode != StatusCodes.Status200OK
            || buffer.Length == 0
            || context.Response.Headers.ContainsKey("ETag"))
        {
            buffer.Seek(0, SeekOrigin.Begin);
            await buffer.CopyToAsync(originalBody);
            context.Response.Body = originalBody;

            return;
        }

        buffer.Seek(0, SeekOrigin.Begin);
        byte[] hash = SHA256.HashData(buffer.ToArray());
        string etag = $"\"{Convert.ToHexString(hash)[..32]}\"";

        context.Response.Headers.ETag = etag;
        context.Response.Headers.CacheControl = "private, no-cache";

        string? ifNoneMatch = context.Request.Headers.IfNoneMatch.ToString();
        if (!string.IsNullOrEmpty(ifNoneMatch) && ifNoneMatch == etag)
        {
            context.Response.StatusCode = StatusCodes.Status304NotModified;
            context.Response.ContentLength = 0;
            context.Response.Body = originalBody;

            return;
        }

        buffer.Seek(0, SeekOrigin.Begin);
        await buffer.CopyToAsync(originalBody);
        context.Response.Body = originalBody;
    }
}
