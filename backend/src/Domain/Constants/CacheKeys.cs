using Sentinel.Domain.Models;

namespace Sentinel.Domain.Constants;

public static class CacheKeys
{
    private const string DashboardPrefix = "dashboard";
    private const string AuthAccountPrefix = "auth:account";
    private const string LatestVersionPrefix = "registry:latest";

    public static readonly TimeSpan AuthAccountTtl = TimeSpan.FromSeconds(30);
    public static readonly TimeSpan LatestVersionTtl = TimeSpan.FromHours(12);
    public static readonly TimeSpan LatestVersionUnresolvedTtl = TimeSpan.FromMinutes(15);

    public static string Dashboard(Guid organizationId) => $"{DashboardPrefix}:{organizationId}";

    public static string AuthAccount(Guid userId) => $"{AuthAccountPrefix}:{userId}";

    public static string LatestVersion(DependencyEcosystem ecosystem, string packageName) =>
        $"{LatestVersionPrefix}:{ecosystem}:{packageName.ToLowerInvariant()}";
}
