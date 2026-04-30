using System.Net;
using System.Text.Json;

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

        (HttpStatusCode statusCode, string message) = exception switch
        {
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized, "Accès non autorisé"),
            KeyNotFoundException => (HttpStatusCode.NotFound, "Ressource introuvable"),
            InvalidOperationException => (HttpStatusCode.BadRequest, "Opération invalide"),
            ArgumentException => (HttpStatusCode.BadRequest, "Requête invalide"),
            _ => (HttpStatusCode.InternalServerError, "Une erreur interne s'est produite")
        };

        context.Response.StatusCode = (int)statusCode;

        var response = new
        {
            status = (int)statusCode,
            message,
            timestamp = DateTime.UtcNow
        };

        string json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}
