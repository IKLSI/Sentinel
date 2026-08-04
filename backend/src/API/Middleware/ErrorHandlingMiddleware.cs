using Sentinel.API.Contracts;
using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Constants;
using Sentinel.Application.Common.Contracts;

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
        UnauthorizedAccessException => (HttpStatusCode.Unauthorized, ErrorCodes.Unauthorized),
        BadHttpRequestException badRequest => ((HttpStatusCode)badRequest.StatusCode, ErrorCodes.InvalidRequest),
        _ => (HttpStatusCode.InternalServerError, ErrorCodes.Unexpected)
    };

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        (HttpStatusCode statusCode, string code) = Map(exception);

        context.Response.StatusCode = (int)statusCode;

        ApiErrorResponse response = new()
        {
            Code = code,
            Status = (int)statusCode
        };

        string json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}
