namespace Sentinel.Domain.Constants;

public static class ConfigurationKeys
{
    public const string DefaultConnectionString = "DefaultConnection";

    public const string CorsAllowedOrigins = "Cors:AllowedOrigins";
    public const string FrontendBaseUrl = "Frontend:BaseUrl";
    public const string StripeSecretKey = "Stripe:SecretKey";

    public static class Sections
    {
        public const string Jwt = "Jwt";
        public const string Email = "Email";
        public const string Frontend = "Frontend";
        public const string Cors = "Cors";
        public const string Stripe = "Stripe";
        public const string Encryption = "Encryption";
        public const string Support = "Support";
        public const string DataProtection = "DataProtection";
        public const string Cookie = "Cookie";
        public const string ForwardedHeaders = "ForwardedHeaders";
    }

    public static class JwtKeys
    {
        public const string Secret = "Secret";
        public const string Issuer = "Issuer";
        public const string Audience = "Audience";
    }
}
