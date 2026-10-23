using Microsoft.Extensions.Options;
using Sentinel.Domain.Abstractions;
using Sentinel.API.Options;
using Sentinel.Application.Auth;
using Sentinel.Application.Options;

namespace Sentinel.API.Services;

public class RefreshTokenCookie : IRefreshTokenStore
{
    private const string Path = "/api/auth";

    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly CookieSettings _cookieSettings;
    private readonly JwtSettings _jwtSettings;
    private readonly IWebHostEnvironment _environment;

    public RefreshTokenCookie(
        IHttpContextAccessor httpContextAccessor,
        IOptions<CookieSettings> cookieOptions,
        IOptions<JwtSettings> jwtOptions,
        IWebHostEnvironment environment)
    {
        _httpContextAccessor = httpContextAccessor;
        _cookieSettings = cookieOptions.Value;
        _jwtSettings = jwtOptions.Value;
        _environment = environment;
    }

    public string? Read() => _httpContextAccessor.HttpContext?.Request.Cookies[_cookieSettings.Name];

    public void Write(string token)
    {
        int expirationDays = RefreshTokenLifetime.DaysFor(_jwtSettings);

        CookieOptions options = BuildOptions();
        options.Expires = DateTime.UtcNow.AddDays(expirationDays);

        _httpContextAccessor.HttpContext?.Response.Cookies.Append(_cookieSettings.Name, token, options);
    }

    public void Clear() =>
        _httpContextAccessor.HttpContext?.Response.Cookies.Delete(_cookieSettings.Name, BuildOptions());

    private CookieOptions BuildOptions() => new()
    {
        HttpOnly = true,
        Secure = !_environment.IsDevelopment(),
        SameSite = Enum.Parse<SameSiteMode>(_cookieSettings.SameSite, ignoreCase: true),
        Domain = string.IsNullOrEmpty(_cookieSettings.Domain) ? null : _cookieSettings.Domain,
        Path = Path,
    };
}
