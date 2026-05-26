namespace Sentinel.Domain.Constants;

public static class HealthCheckConstants
{
    public const string PostgresName = "postgres";
    public const string ReadyTag = "ready";
    public const string LivePath = "/health/live";
    public const string ReadyPath = "/health/ready";
}
