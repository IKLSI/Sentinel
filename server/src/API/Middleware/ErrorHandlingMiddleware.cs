using Sentinel.API.Contracts;
using System.Net;
using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Constants;

namespace Sentinel.API.Middleware;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            _logger.LogDebug("Request {Path} aborted by the client", context.Request.Path);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while handling {Path}", context.Request.Path);

            if (context.Response.HasStarted)
            {
                _logger.LogWarning("Response for {Path} already started, connection aborted without an error payload",
                    context.Request.Path);
                context.Abort();
                return;
            }

            await HandleExceptionAsync(context, ex);
        }
    }

    private static (HttpStatusCode StatusCode, string Code) Map(Exception exception) => exception switch
    {
        DbUpdateConcurrencyException => (HttpStatusCode.Conflict, ErrorCodes.Concurrency),
        BadHttpRequestException badRequest => ((HttpStatusCode)badRequest.StatusCode, ErrorCodes.InvalidRequest),
        _ => (HttpStatusCode.InternalServerError, ErrorCodes.Unexpected)
    };

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        (HttpStatusCode statusCode, string code) = Map(exception);

        context.Response.StatusCode = (int)statusCode;

        await context.Response.WriteAsJsonAsync(ApiErrorResponse.Create(code, (int)statusCode));
    }
}
