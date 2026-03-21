using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Sentinel.API.Middleware;

public class JwtMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IConfiguration _configuration;
    private readonly ILogger<JwtMiddleware> _logger;
    private const string BearerPrefix = "Bearer ";

    public JwtMiddleware(RequestDelegate next, IConfiguration configuration, ILogger<JwtMiddleware> logger)
    {
        _next = next;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        string? token = ExtractToken(context);

        if (!string.IsNullOrEmpty(token))
        {
            AttachUserToContext(context, token);
        }

        await _next(context);
    }

    private static string? ExtractToken(HttpContext context)
    {
        string? authHeader = context.Request.Headers["Authorization"].FirstOrDefault();

        if (authHeader != null && authHeader.StartsWith(BearerPrefix))
        {
            return authHeader[BearerPrefix.Length..].Trim();
        }

        return context.Request.Query["access_token"].FirstOrDefault();
    }

    private void AttachUserToContext(HttpContext context, string token)
    {
        try
        {
            IConfigurationSection jwtSettings = _configuration.GetSection("Jwt");
            string secret = jwtSettings["Secret"]!;

            JwtSecurityTokenHandler tokenHandler = new JwtSecurityTokenHandler();
            byte[] key = Encoding.UTF8.GetBytes(secret);

            tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = jwtSettings["Issuer"],
                ValidateAudience = true,
                ValidAudience = jwtSettings["Audience"],
                ClockSkew = TimeSpan.Zero
            }, out _);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Token JWT invalide ou expiré");
        }
    }
}
