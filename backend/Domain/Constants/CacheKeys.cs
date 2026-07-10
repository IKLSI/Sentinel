namespace Sentinel.Domain.Constants;

public static class CacheKeys
{
    private const string DashboardPrefix = "dashboard";
    private const string AuthAccountPrefix = "auth:account";

    public static readonly TimeSpan AuthAccountTtl = TimeSpan.FromSeconds(30);

    public static string Dashboard(Guid organizationId) => $"{DashboardPrefix}:{organizationId}";

    public static string AuthAccount(Guid userId) => $"{AuthAccountPrefix}:{userId}";
}
