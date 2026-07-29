using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Sentinel.Application.Services;
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

        (HttpStatusCode statusCode, string code, IReadOnlyDictionary<string, string>? parameters) = exception switch
        {
            QuotaExceededException quota => (HttpStatusCode.PaymentRequired, quota.Code, quota.Params),
            EmailNotVerifiedException notVerified => (HttpStatusCode.Forbidden, notVerified.Code, notVerified.Params),
            ResourceNotFoundException notFound => (HttpStatusCode.NotFound, notFound.Code, notFound.Params),
            BusinessRuleException businessRule => (businessRule.StatusCode, businessRule.Code, businessRule.Params),
            DbUpdateConcurrencyException => (HttpStatusCode.Conflict, ErrorCodes.Concurrency, null),
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized, ErrorCodes.Unauthorized, null),
            KeyNotFoundException => (HttpStatusCode.NotFound, ErrorCodes.NotFound, null),
            InvalidOperationException => (HttpStatusCode.BadRequest, ErrorCodes.InvalidOperation, null),
            ArgumentException => (HttpStatusCode.BadRequest, ErrorCodes.InvalidRequest, null),
            _ => (HttpStatusCode.InternalServerError, ErrorCodes.Unexpected, null)
        };

        context.Response.StatusCode = (int)statusCode;

        ApiErrorResponse response = new()
        {
            Code = code,
            Status = (int)statusCode,
            Params = parameters
        };

        string json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}
