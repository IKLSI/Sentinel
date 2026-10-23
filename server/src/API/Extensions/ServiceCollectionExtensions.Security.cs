using Sentinel.API.Contracts;
using Sentinel.API.Constants;
using System.Net;
using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Sentinel.Domain.Constants;
using Sentinel.API.Options;
using Sentinel.Application.Auth.AccountState;
using Sentinel.Application.Options;

namespace Sentinel.API.Extensions;

public static partial class ServiceCollectionExtensions
{
    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        JwtSettings jwt = ReadSettings<JwtSettings>(configuration, ConfigurationKeys.Sections.Jwt);

        if (string.IsNullOrWhiteSpace(jwt.Secret))
            throw new InvalidOperationException("The JWT key is missing from the configuration");

        if (Encoding.UTF8.GetByteCount(jwt.Secret) < 32)
            throw new InvalidOperationException("The JWT key must be at least 256 bits (32 UTF-8 bytes)");

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwt.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwt.Audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Secret)),
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };

                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = ReadHubAccessToken,
                    OnTokenValidated = ValidateAccountStateAsync
                };
            });

        services.AddAuthorization();
        return services;
    }

    private static Task ReadHubAccessToken(MessageReceivedContext context)
    {
        if (!context.Request.Path.StartsWithSegments(RealtimeConstants.HubPath, StringComparison.OrdinalIgnoreCase))
            return Task.CompletedTask;

        string? accessToken = context.Request.Query[RealtimeConstants.AccessTokenQueryParameter];

        if (!string.IsNullOrEmpty(accessToken))
            context.Token = accessToken;

        return Task.CompletedTask;
    }

    private static async Task ValidateAccountStateAsync(TokenValidatedContext context)
    {
        IServiceProvider sp = context.HttpContext.RequestServices;

        string? userIdClaim = context.Principal?.FindFirst(ClaimNames.UserId)?.Value;
        string? versionClaim = context.Principal?.FindFirst(ClaimNames.TokenVersion)?.Value;

        if (!Guid.TryParse(userIdClaim, out Guid userId) || !int.TryParse(versionClaim, out int tokenVersion))
        {
            context.Fail("Invalid token");
            return;
        }

        AccountSessionValidator sessionValidator = sp.GetRequiredService<AccountSessionValidator>();

        if (!await sessionValidator.IsSessionValidAsync(userId, tokenVersion, context.HttpContext.RequestAborted))
        {
            context.Fail("Expired session");
            return;
        }

        if (long.TryParse(context.Principal?.FindFirst(JwtRegisteredClaimNames.Exp)?.Value, out long expSeconds))
            context.Properties.ExpiresUtc = DateTimeOffset.FromUnixTimeSeconds(expSeconds);
    }

    public static IServiceCollection AddCorsPolicy(this IServiceCollection services, IConfiguration configuration)
    {
        string[] origins = ResolveAllowedOrigins(configuration);

        services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy =>
            {
                policy
                    .WithOrigins(origins)
                    .WithHeaders("Authorization", "Content-Type", "Accept", "X-Requested-With",
                        RealtimeConstants.UserAgentHeader)
                    .WithExposedHeaders("Content-Disposition")
                    .WithMethods("GET", "POST", "PUT", "PATCH", "DELETE")
                    .AllowCredentials();
            });
        });

        return services;
    }

    private static string[] ResolveAllowedOrigins(IConfiguration configuration)
    {
        HashSet<string> origins = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        CorsSettings cors = ReadSettings<CorsSettings>(configuration, ConfigurationKeys.Sections.Cors);

        foreach (string origin in cors.AllowedOrigins)
        {
            if (IsValidOrigin(origin))
            {
                origins.Add(origin.TrimEnd('/'));
            }
        }

        FrontendSettings frontend = ReadSettings<FrontendSettings>(configuration, ConfigurationKeys.Sections.Frontend);

        if (IsValidOrigin(frontend.BaseUrl))
        {
            origins.Add(frontend.BaseUrl.TrimEnd('/'));
        }

        if (origins.Count == 0)
        {
            origins.Add(FrontendSettings.DefaultBaseUrl);
        }

        return origins.ToArray();
    }

    private static bool IsValidOrigin(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return false;
        if (!Uri.TryCreate(value, UriKind.Absolute, out Uri? uri)) return false;

        return uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps;
    }

    public static IServiceCollection AddForwardedHeadersPolicy(this IServiceCollection services,
        IConfiguration configuration, IHostEnvironment environment)
    {
        ForwardedHeadersSettings settings = ReadSettings<ForwardedHeadersSettings>(configuration, ConfigurationKeys.Sections.ForwardedHeaders);

        if (!environment.IsDevelopment() && settings.KnownProxies.Count == 0 && settings.KnownNetworks.Count == 0)
            throw new InvalidOperationException(
                "ForwardedHeaders:KnownProxies or ForwardedHeaders:KnownNetworks must be set outside development: " +
                "without a declared reverse proxy, X-Forwarded-For is ignored and every request shares the proxy IP address, " +
                "which makes rate limiting global instead of per client");

        services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
            options.ForwardLimit = settings.ForwardLimit;
            options.KnownProxies.Clear();
            options.KnownIPNetworks.Clear();

            foreach (string proxy in settings.KnownProxies)
            {
                if (!IPAddress.TryParse(proxy, out IPAddress? address))
                    throw new InvalidOperationException(
                        $"ForwardedHeaders:KnownProxies contains an invalid IP address: '{proxy}'");

                options.KnownProxies.Add(address);
            }

            foreach (string network in settings.KnownNetworks)
            {
                if (!System.Net.IPNetwork.TryParse(network, out System.Net.IPNetwork parsed))
                    throw new InvalidOperationException(
                        $"ForwardedHeaders:KnownNetworks contains an invalid network: '{network}'");

                options.KnownIPNetworks.Add(parsed);
            }
        });

        return services;
    }

    public static IServiceCollection AddLoginRateLimiting(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options
                .AddFixedWindowPolicy(RateLimitPolicies.Login, 5, TimeSpan.FromMinutes(15))
                .AddFixedWindowPolicy(RateLimitPolicies.Refresh, 120, TimeSpan.FromMinutes(15))
                .AddFixedWindowPolicy(RateLimitPolicies.PasswordReset, 10, TimeSpan.FromMinutes(60))
                .AddFixedWindowPolicy(RateLimitPolicies.ForgotPassword, 5, TimeSpan.FromMinutes(60))
                .AddFixedWindowPolicy(RateLimitPolicies.VerifyEmail, 20, TimeSpan.FromMinutes(60))
                .AddFixedWindowPolicy(RateLimitPolicies.ResendVerification, 5, TimeSpan.FromMinutes(60))
                .AddFixedWindowPolicy(RateLimitPolicies.Invitation, 10, TimeSpan.FromMinutes(15))
                .AddFixedWindowPolicy(RateLimitPolicies.InviteUser, 20, TimeSpan.FromMinutes(60), ResolveUserOrClientKey)
                .AddFixedWindowPolicy(RateLimitPolicies.Register, 5, TimeSpan.FromMinutes(60))
                .AddFixedWindowPolicy(RateLimitPolicies.Scan, 10, TimeSpan.FromMinutes(1), ResolveUserOrClientKey)
                .AddFixedWindowPolicy(RateLimitPolicies.PublicScan, 5, TimeSpan.FromMinutes(10))
                .AddFixedWindowPolicy(RateLimitPolicies.PublicBadge, 120, TimeSpan.FromMinutes(1))
                .AddFixedWindowPolicy(RateLimitPolicies.PublicRuntimeLifecycles, 60, TimeSpan.FromMinutes(1))
                .AddFixedWindowPolicy(RateLimitPolicies.RemediationConfig, 30, TimeSpan.FromMinutes(1))
                .AddFixedWindowPolicy(RateLimitPolicies.RemediationCompletion, 30, TimeSpan.FromMinutes(1))
                .AddFixedWindowPolicy(RateLimitPolicies.Export, 5, TimeSpan.FromMinutes(1), ResolveUserOrClientKey);

            options.OnRejected = async (context, cancellationToken) =>
            {
                context.HttpContext.Response.StatusCode = 429;
                context.HttpContext.Response.ContentType = "application/json";
                await context.HttpContext.Response.WriteAsJsonAsync(
                    ApiErrorResponse.Create(ErrorCodes.TooManyRequests, StatusCodes.Status429TooManyRequests),
                    cancellationToken);
            };
        });

        return services;
    }

    private static RateLimiterOptions AddFixedWindowPolicy(
        this RateLimiterOptions options,
        string policyName,
        int permitLimit,
        TimeSpan window,
        Func<HttpContext, string>? partitionKeySelector = null)
        => options.AddPolicy(policyName, httpContext =>
            RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: (partitionKeySelector ?? ResolveClientKey)(httpContext),
                factory: _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = permitLimit,
                    Window = window,
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0
                }));

    private static string ResolveClientKey(HttpContext httpContext)
        => httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

    private static string ResolveUserOrClientKey(HttpContext httpContext)
        => httpContext.User.FindFirst(ClaimNames.UserId)?.Value ?? ResolveClientKey(httpContext);
}
