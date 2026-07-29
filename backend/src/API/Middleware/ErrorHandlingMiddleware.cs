using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Sentinel.Application.Audit;
using Sentinel.Application.Common;
using Sentinel.Application.Exports;
using Sentinel.Application.Notifications;
using Sentinel.Application.Security;
using Sentinel.Application.TechHealth;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Common;

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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Une erreur inattendue s'est produite lors du traitement de {Path}", context.Request.Path);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        (HttpStatusCode statusCode, string code) = exception switch
        {
            DbUpdateConcurrencyException => (HttpStatusCode.Conflict, ErrorCodes.Concurrency),
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized, ErrorCodes.Unauthorized),
            KeyNotFoundException => (HttpStatusCode.NotFound, ErrorCodes.NotFound),
            InvalidOperationException => (HttpStatusCode.BadRequest, ErrorCodes.InvalidOperation),
            ArgumentException => (HttpStatusCode.BadRequest, ErrorCodes.InvalidRequest),
            _ => (HttpStatusCode.InternalServerError, ErrorCodes.Unexpected)
        };

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
