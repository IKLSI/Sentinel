namespace Sentinel.Domain.Constants;

public static class ConfigurationKeys
{
    public const string DefaultConnectionString = "DefaultConnection";
    public const string MigrationsConnectionString = "Migrations";

    public static class Sections
    {
        public const string Jwt = "Jwt";
        public const string Email = "Email";
        public const string Frontend = "Frontend";
        public const string Cors = "Cors";
        public const string Support = "Support";
        public const string DataProtection = "DataProtection";
        public const string Cookie = "Cookie";
        public const string ForwardedHeaders = "ForwardedHeaders";
        public const string Database = "Database";
        public const string RepositoryHosts = "RepositoryHosts";
        public const string Remediation = "Remediation";
    }
}
