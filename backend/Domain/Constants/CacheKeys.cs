namespace Sentinel.Domain.Constants;

public static class CacheKeys
{
    private const string DashboardPrefix = "dashboard";

    public static string Dashboard(Guid organizationId) => $"{DashboardPrefix}:{organizationId}";
}
