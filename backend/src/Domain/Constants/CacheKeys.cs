using Sentinel.Domain.Models;

namespace Sentinel.Domain.Constants;

public static class CacheKeys
{
    private const string DashboardPrefix = "dashboard";
    private const string AuthAccountPrefix = "auth:account";
    private const string LatestVersionPrefix = "registry:latest";
    private const string RevokedTokenPrefix = "auth:revoked";

    public static readonly TimeSpan AuthAccountTtl = TimeSpan.FromSeconds(30);
    public static readonly TimeSpan RevokedTokenTtl = TimeSpan.FromMinutes(5);
    public static readonly TimeSpan RevokedTokenNegativeTtl = TimeSpan.FromSeconds(15);
    public static readonly TimeSpan LatestVersionTtl = TimeSpan.FromHours(12);
    public static readonly TimeSpan LatestVersionUnresolvedTtl = TimeSpan.FromMinutes(15);

    public static string Dashboard(Guid organizationId) => $"{DashboardPrefix}:{organizationId}";

    public static string AuthAccount(Guid userId) => $"{AuthAccountPrefix}:{userId}";

    public static string RevokedToken(string jti) => $"{RevokedTokenPrefix}:{jti}";

    public static string LatestVersion(DependencyEcosystem ecosystem, string packageName) =>
        $"{LatestVersionPrefix}:{ecosystem}:{packageName.ToLowerInvariant()}";
}
