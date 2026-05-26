namespace Sentinel.Domain.Constants;

public static class CacheKeys
{
    public const string DashboardPrefix = "dashboard";

    public static string Dashboard(Guid organizationId) => $"{DashboardPrefix}:{organizationId}";
}
