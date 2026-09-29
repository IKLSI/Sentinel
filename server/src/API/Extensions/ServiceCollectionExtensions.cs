using System.ComponentModel.DataAnnotations;
using Microsoft.Extensions.Options;
using Sentinel.Domain.Constants;
using Sentinel.API.Options;
using Sentinel.Application.Options;
using Sentinel.Infrastructure.Email;
using Sentinel.Infrastructure.Payments;

namespace Sentinel.API.Extensions;

public static partial class ServiceCollectionExtensions
{
    public static IServiceCollection AddSettings(this IServiceCollection services, IConfiguration configuration, IHostEnvironment environment)
    {
        bool validateDeploymentSettings = !environment.IsDevelopment();

        services.BindSettings<JwtSettings>(configuration, ConfigurationKeys.Sections.Jwt, true);
        services.BindSettings<EmailSettings>(configuration, ConfigurationKeys.Sections.Email, validateDeploymentSettings);
        services.BindSettings<FrontendSettings>(configuration, ConfigurationKeys.Sections.Frontend, validateDeploymentSettings);
        services.BindSettings<StripeSettings>(configuration, ConfigurationKeys.Sections.Stripe, validateDeploymentSettings);
        services.BindSettings<SupportSettings>(configuration, ConfigurationKeys.Sections.Support, false);
        services.BindSettings<CorsSettings>(configuration, ConfigurationKeys.Sections.Cors, false);
        services.BindSettings<DataProtectionSettings>(configuration, ConfigurationKeys.Sections.DataProtection, false);
        services.BindSettings<CookieSettings>(configuration, ConfigurationKeys.Sections.Cookie, false);
        services.BindSettings<DatabaseSettings>(configuration, ConfigurationKeys.Sections.Database, true);

        services.AddOptions<SupportSettings>()
            .Validate(settings => string.IsNullOrWhiteSpace(settings.Email) || new EmailAddressAttribute().IsValid(settings.Email),
                "Support:Email must be a valid email address when provided")
            .ValidateOnStart();

        services.AddOptions<CookieSettings>()
            .Validate(settings => Enum.TryParse<SameSiteMode>(settings.SameSite, ignoreCase: true, out _),
                "Cookie:SameSite must be 'None', 'Lax', 'Strict' or 'Unspecified'")
            .ValidateOnStart();

        if (validateDeploymentSettings)
        {
            services.AddOptions<FrontendSettings>()
                .Validate(settings => !IsLoopbackUrl(settings.BaseUrl),
                    "Frontend:BaseUrl is required outside development: the localhost fallback URL would break email links");
        }

        return services;
    }

    private static bool IsLoopbackUrl(string value)
        => Uri.TryCreate(value, UriKind.Absolute, out Uri? uri) && uri.IsLoopback;

    private static IServiceCollection BindSettings<TSettings>(this IServiceCollection services, IConfiguration configuration, string section, bool validate)
        where TSettings : class
    {
        OptionsBuilder<TSettings> builder = services
            .AddOptions<TSettings>()
            .Bind(configuration.GetSection(section));

        if (validate)
        {
            builder.ValidateDataAnnotations().ValidateOnStart();
        }

        return services;
    }

    private static TSettings ReadSettings<TSettings>(IConfiguration configuration, string section)
        where TSettings : class, new()
        => configuration.GetSection(section).Get<TSettings>() ?? new TSettings();
}
