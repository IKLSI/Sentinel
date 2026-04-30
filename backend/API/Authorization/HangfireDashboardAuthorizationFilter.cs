using System.Net.Http.Headers;
using Hangfire.Dashboard;

namespace Sentinel.API.Authorization;

public class HangfireDashboardAuthorizationFilter : IDashboardAuthorizationFilter
{
    private readonly string _username;
    private readonly string _password;

    public HangfireDashboardAuthorizationFilter(IConfiguration configuration)
    {
        _username = configuration["Hangfire:Username"]
            ?? throw new InvalidOperationException("Hangfire:Username est manquant dans la configuration");
        _password = configuration["Hangfire:Password"]
            ?? throw new InvalidOperationException("Hangfire:Password est manquant dans la configuration");
    }

    public bool Authorize(DashboardContext context)
    {
        HttpContext httpContext = context.GetHttpContext();

        string? authHeader = httpContext.Request.Headers["Authorization"];

        if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Basic ", StringComparison.OrdinalIgnoreCase))
        {
            Challenge(httpContext);
            return false;
        }

        try
        {
            AuthenticationHeaderValue header = AuthenticationHeaderValue.Parse(authHeader);
            if (header.Parameter is null)
            {
                Challenge(httpContext);
                return false;
            }

            string[] credentials = System.Text.Encoding.UTF8
                .GetString(Convert.FromBase64String(header.Parameter))
                .Split(':', 2);

            if (credentials.Length == 2 && credentials[0] == _username && credentials[1] == _password)
                return true;
        }
        catch
        {}

        Challenge(httpContext);
        return false;
    }

    private static void Challenge(HttpContext context)
    {
        context.Response.StatusCode = 401;
        context.Response.Headers["WWW-Authenticate"] = "Basic realm=\"Hangfire Dashboard\"";
    }
}
