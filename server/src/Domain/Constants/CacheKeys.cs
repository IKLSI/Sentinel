using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Constants;

public static class CacheKeys
{
    private const string DashboardPrefix = "dashboard";
    private const string AuthAccountPrefix = "auth:account";
    private const string LatestVersionPrefix = "registry:latest";
    private const string ApiKeyPrincipalPrefix = "auth:apikey";
    private const string LocalePrefix = "locale";
    private const string AdvisoryPrefix = "osv:advisory";
    private const string RuntimeLifecyclePrefix = "eol:product";
    private const string EpssPrefix = "epss:cve";
    private const string PublicScanPrefix = "public-scan";
    private const string AvailableReposPrefix = "available-repos";

    public const string KnownExploitedCatalog = "kev:catalog";
    public const string KnownExploitedCatalogUnavailable = "kev:unavailable";

    public static readonly TimeSpan AuthAccountTtl = TimeSpan.FromSeconds(30);
    public static readonly TimeSpan ApiKeyPrincipalTtl = TimeSpan.FromSeconds(30);
    public static readonly TimeSpan LatestVersionTtl = TimeSpan.FromHours(12);
    public static readonly TimeSpan LatestVersionUnresolvedTtl = TimeSpan.FromMinutes(15);
    public static readonly TimeSpan LocaleTtl = TimeSpan.FromHours(1);
    public static readonly TimeSpan AdvisoryTtl = TimeSpan.FromHours(24);
    public static readonly TimeSpan RuntimeLifecycleTtl = TimeSpan.FromHours(12);
    public static readonly TimeSpan RuntimeLifecycleUnresolvedTtl = TimeSpan.FromMinutes(15);
    public static readonly TimeSpan ExploitSignalTtl = TimeSpan.FromHours(24);
    public static readonly TimeSpan ExploitSignalUnavailableTtl = TimeSpan.FromMinutes(15);
    public static readonly TimeSpan PublicScanTtl = TimeSpan.FromMinutes(15);
    public static readonly TimeSpan PublicScanUnpinnedTtl = TimeSpan.FromMinutes(10);
    public static readonly TimeSpan AvailableReposTtl = TimeSpan.FromMinutes(3);

    public static string Dashboard(Guid organizationId) => $"{DashboardPrefix}:{organizationId}";

    public static string AuthAccount(Guid userId) => $"{AuthAccountPrefix}:{userId}";

    public static string ApiKeyPrincipal(string keyHash) => $"{ApiKeyPrincipalPrefix}:{keyHash}";

    public static string Locale(string culture) => $"{LocalePrefix}:{culture}";

    public static string LatestVersion(DependencyEcosystem ecosystem, string packageName) =>
        $"{LatestVersionPrefix}:{ecosystem}:{packageName.ToLowerInvariant()}";

    public static string Advisory(string advisoryId) => $"{AdvisoryPrefix}:{advisoryId}";

    public static string RuntimeLifecycle(string product) => $"{RuntimeLifecyclePrefix}:{product}";

    public static string Epss(string cveId) => $"{EpssPrefix}:{cveId.ToUpperInvariant()}";

    public static string PublicScan(string host, string owner, string repository, string? commitSha) =>
        $"{PublicScanPrefix}:{host}/{owner}/{repository}:{commitSha}".ToLowerInvariant();

    public static string AvailableRepos(Guid organizationId, RepositoryType platform, string tokenFingerprint) =>
        $"{AvailableReposPrefix}:{organizationId}:{platform}:{tokenFingerprint}";
}
