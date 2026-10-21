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
    private const string PackageAdvisoriesPrefix = "osv:package";
    private const string RuntimeLifecyclePrefix = "eol:product";
    private const string EpssPrefix = "epss:cve";
    private const string PublicScanPrefix = "public-scan";
    private const string PublicScanLatestPrefix = "public-scan-latest";
    private const string ProjectBadgePrefix = "project-badge";
    private const string AvailableReposPrefix = "available-repos";
    private const string RefreshGracePrefix = "auth:refresh-grace";
    private const string GitHubPublicRepositoryPrefix = "github:public";

    public const string KnownExploitedCatalog = "kev:catalog";
    public const string KnownExploitedCatalogUnavailable = "kev:unavailable";
    public const string PublicRuntimeLifecycles = "public:runtime-lifecycles";

    public static readonly TimeSpan AuthAccountTtl = TimeSpan.FromSeconds(30);
    public static readonly TimeSpan ApiKeyPrincipalTtl = TimeSpan.FromSeconds(30);
    public static readonly TimeSpan LatestVersionTtl = TimeSpan.FromHours(12);
    public static readonly TimeSpan LatestVersionUnresolvedTtl = TimeSpan.FromMinutes(15);
    public static readonly TimeSpan LocaleTtl = TimeSpan.FromHours(1);
    public static readonly TimeSpan AdvisoryTtl = TimeSpan.FromHours(24);
    public static readonly TimeSpan PackageAdvisoriesTtl = TimeSpan.FromHours(1);
    public static readonly TimeSpan RuntimeLifecycleTtl = TimeSpan.FromHours(12);
    public static readonly TimeSpan RuntimeLifecycleUnresolvedTtl = TimeSpan.FromMinutes(15);
    public static readonly TimeSpan ExploitSignalTtl = TimeSpan.FromHours(24);
    public static readonly TimeSpan ExploitSignalUnavailableTtl = TimeSpan.FromMinutes(15);
    public static readonly TimeSpan PublicScanTtl = TimeSpan.FromMinutes(15);
    public static readonly TimeSpan ProjectBadgeTtl = TimeSpan.FromMinutes(5);
    public static readonly TimeSpan PublicScanUnpinnedTtl = TimeSpan.FromMinutes(10);
    public static readonly TimeSpan PublicScanLatestTtl = TimeSpan.FromMinutes(5);
    public static readonly TimeSpan AvailableReposTtl = TimeSpan.FromMinutes(3);
    public static readonly TimeSpan RefreshGraceTtl = TimeSpan.FromSeconds(30);
    public static readonly TimeSpan GitHubPublicRepositoryTtl = TimeSpan.FromMinutes(10);
    public static readonly TimeSpan PublicRuntimeLifecyclesTtl = TimeSpan.FromMinutes(10);

    public static string Dashboard(Guid organizationId) => $"{DashboardPrefix}:{organizationId}";

    public static string AuthAccount(Guid userId) => $"{AuthAccountPrefix}:{userId}";

    public static string ApiKeyPrincipal(string keyHash) => $"{ApiKeyPrincipalPrefix}:{keyHash}";

    public static string Locale(string culture) => $"{LocalePrefix}:{culture}";

    public static string LatestVersion(DependencyEcosystem ecosystem, string packageName) =>
        $"{LatestVersionPrefix}:{ecosystem}:{packageName.ToLowerInvariant()}";

    public static string Advisory(string advisoryId) => $"{AdvisoryPrefix}:{advisoryId}";

    public static string PackageAdvisories(DependencyEcosystem ecosystem, string packageName, string version) =>
        $"{PackageAdvisoriesPrefix}:{ecosystem}:{packageName.ToLowerInvariant()}@{version}";

    public static string RuntimeLifecycle(string product) => $"{RuntimeLifecyclePrefix}:{product}";

    public static string Epss(string cveId) => $"{EpssPrefix}:{cveId.ToUpperInvariant()}";

    public static string PublicScan(string host, string owner, string repository, string? commitSha) =>
        $"{PublicScanPrefix}:{host}/{owner}/{repository}:{commitSha}".ToLowerInvariant();

    public static string PublicScanLatest(string host, string owner, string repository) =>
        $"{PublicScanLatestPrefix}:{host}/{owner}/{repository}".ToLowerInvariant();

    public static string ProjectBadge(string token) => $"{ProjectBadgePrefix}:{token}";

    public static string RefreshGrace(string previousTokenHash) => $"{RefreshGracePrefix}:{previousTokenHash}";

    public static string GitHubPublicRepository(string owner, string repository) =>
        $"{GitHubPublicRepositoryPrefix}:{owner}/{repository}".ToLowerInvariant();

    public static string AvailableRepos(Guid organizationId, RepositoryType platform, string tokenFingerprint) =>
        $"{AvailableReposPrefix}:{organizationId}:{platform}:{tokenFingerprint}";
}
