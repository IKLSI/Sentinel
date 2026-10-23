using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Sentinel.API.Attributes;
using Sentinel.Infrastructure.Data;
using Sentinel.API.Options;

namespace Sentinel.API.Middleware;

public class DatabaseConnectionScopeMiddleware
{
    private readonly RequestDelegate _next;
    private readonly bool _enabled;

    public DatabaseConnectionScopeMiddleware(RequestDelegate next, IOptions<DatabaseSettings> options)
    {
        _next = next;
        _enabled = options.Value.KeepConnectionOpenPerRequest;
    }

    public async Task InvokeAsync(HttpContext context, SentinelContext dbContext)
    {
        if (!_enabled || !IsControllerEndpoint(context))
        {
            await _next(context);
            return;
        }

        await dbContext.Database.OpenConnectionAsync(context.RequestAborted);

        try
        {
            await _next(context);
        }
        finally
        {
            await dbContext.Database.CloseConnectionAsync();
        }
    }

    private static bool IsControllerEndpoint(HttpContext context) =>
        context.GetEndpoint()?.Metadata.GetMetadata<ControllerActionDescriptor>() is not null
        && context.GetEndpoint()?.Metadata.GetMetadata<SkipConnectionScopeAttribute>() is null;
}
