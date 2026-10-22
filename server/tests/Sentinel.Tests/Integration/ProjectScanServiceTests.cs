using System.Linq.Expressions;
using FluentAssertions;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Sentinel.Application.Dashboard;
using Sentinel.Application.Options;
using Sentinel.Application.Security;
using Sentinel.Application.TechHealth.Scan;
using Sentinel.Application.TechHealth.Suppressions;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Git;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Realtime;
using Sentinel.Domain.TechHealth;
using Sentinel.Infrastructure.Data;
using Sentinel.Infrastructure.Repositories;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Integration;

[Collection(PostgresCollection.Name)]
public class ProjectScanServiceTests
{
    private const string PackageJson = """{ "dependencies": { "axios": "1.6.0" } }""";

    private readonly PostgresFixture _fixture;

    public ProjectScanServiceTests(PostgresFixture fixture)
    {
        _fixture = fixture;
    }

    private sealed class FakeHost : IRepositoryHostClient
    {
        public string HeadCommitSha { get; set; } = "sha-1";
        public string ManifestContent { get; set; } = PackageJson;
        public bool ListingFails { get; set; }
        public int ListFilesCalls { get; private set; }
        public string? LastRequestedSha { get; private set; }

        public Task<RepositoryListing> ListUserRepositoriesAsync(string token, string platform,
            GitLabInstance gitLab, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<(string Id, string Login)?> GetAuthenticatedAccountAsync(string token, string platform,
            GitLabInstance gitLab, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<string?> GetHeadCommitAsync(string host, string owner, string repo, RepositoryAccess? access,
            string? branch, CancellationToken cancellationToken) =>
            Task.FromResult<string?>(HeadCommitSha);

        public Task<RepositoryBranchListing?> ListBranchesAsync(string host, string owner, string repo,
            RepositoryAccess? access, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<RepositoryFileListing> ListFilesAsync(string host, string owner, string repo,
            RepositoryAccess? access, string? commitSha, CancellationToken cancellationToken)
        {
            ListFilesCalls++;
            LastRequestedSha = commitSha;

            return Task.FromResult(ListingFails
                ? new RepositoryFileListing([], false)
                : new RepositoryFileListing([("package.json", "https://host/package.json", "package.json")], false));
        }

        public Task<string?> FetchTextAsync(string host, string url, RepositoryAccess? access, CancellationToken cancellationToken) =>
            Task.FromResult<string?>(ManifestContent);

        public Task<string?> FindMergeRequestUrlAsync(string host, string owner, string repo,
            RepositoryAccess access, string sourceBranch, CancellationToken cancellationToken) =>
            Task.FromResult<string?>(null);
    }

    private sealed class FakeRegistry : IDependencyRegistryClient
    {
        public int Calls { get; private set; }
        public string? LatestVersion { get; set; } = "1.6.0";

        public Task<IReadOnlyDictionary<RegistryPackageQuery, RegistryPackageMetadata>> GetMetadataAsync(
            IReadOnlyCollection<RegistryPackageQuery> packages, CancellationToken cancellationToken)
        {
            Calls++;

            return Task.FromResult<IReadOnlyDictionary<RegistryPackageQuery, RegistryPackageMetadata>>(
                packages.ToDictionary(package => package,
                    _ => new RegistryPackageMetadata(LatestVersion, null, null, false)));
        }
    }

    private sealed class FakeFeed : IVulnerabilityFeedClient
    {
        public List<string> ReportedIds { get; set; } = [];
        public bool IsComplete { get; set; } = true;
        public Dictionary<string, VulnerabilityAdvisory> Advisories { get; } = new();

        public Task<VulnerabilityQueryResult> QueryAsync(IReadOnlyList<VulnerabilityQuery> queries, CancellationToken cancellationToken) =>
            Task.FromResult(new VulnerabilityQueryResult(
                queries.Select(_ => (IReadOnlyList<string>?)ReportedIds).ToList(), IsComplete));

        public Task<IReadOnlyDictionary<string, VulnerabilityAdvisory>> GetAdvisoriesAsync(
            IReadOnlyCollection<string> advisoryIds, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyDictionary<string, VulnerabilityAdvisory>>(
                Advisories.Where(entry => advisoryIds.Contains(entry.Key))
                    .ToDictionary(entry => entry.Key, entry => entry.Value));
    }

    private sealed class NoopLifecycle : IRuntimeLifecycleClient
    {
        public Task<RuntimeLifecycle?> GetLifecycleAsync(string runtimeName, string version, CancellationToken cancellationToken) =>
            Task.FromResult<RuntimeLifecycle?>(null);
    }

    private sealed class NoopExploitIntelligence : IExploitIntelligenceClient
    {
        public Task<IReadOnlyDictionary<string, ExploitSignal>> GetSignalsAsync(IReadOnlyCollection<string> cveIds, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyDictionary<string, ExploitSignal>>(new Dictionary<string, ExploitSignal>());
    }

    private sealed class NoopJobScheduler : IJobScheduler
    {
        public void Enqueue<TJob>(string queue, Expression<Func<TJob, Task>> methodCall) { }

        public void Schedule<TJob>(string queue, Expression<Func<TJob, Task>> methodCall, TimeSpan delay) { }

    }

    private sealed class NoopNotifier : IRealtimeNotifier
    {
        public Task NotifyOrganizationAsync(Guid organizationId, RealtimeEvent notification) =>
            Task.CompletedTask;

        public Task NotifyAllAsync(RealtimeEvent notification) => Task.CompletedTask;
    }

    private sealed class Harness : IAsyncDisposable
    {
        private Harness(PostgresScope scope)
        {
            Scope = scope;

            VulnerabilityRepository vulnerabilities = new VulnerabilityRepository(scope.Context);

            ProjectInventoryWriter inventoryWriter = new ProjectInventoryWriter(
                new DependencyRepository(scope.Context), vulnerabilities, new RuntimeRepository(scope.Context),
                scope.CommitScopeFactory);
            RepositoryScannerService repositoryScanner = new RepositoryScannerService(Host,
                new ManifestParserService(), new RegistryMetadataApplier(Registry),
                NullLogger<RepositoryScannerService>.Instance);

            Service = new ProjectScanService(
                scope.Projects,
                vulnerabilities,
                new ProjectInventoryAcquirer(repositoryScanner, inventoryWriter, scope.Organizations,
                    new TokenProtector(new EphemeralDataProtectionProvider(), NullLogger<TokenProtector>.Instance),
                    NullLogger<ProjectInventoryAcquirer>.Instance),
                new ProjectFindingsRefresher(repositoryScanner, new VulnerabilityScanService(Feed),
                    new RuntimeEolScanService(new NoopLifecycle()),
                    new ExploitSignalEnricher(new NoopExploitIntelligence()), inventoryWriter),
                inventoryWriter,
                new ProjectHealthHistoryWriter(new ProjectHealthSnapshotRepository(scope.Context),
                    new VulnerabilityResolutionRepository(scope.Context)),
                new ProjectHealthRecalculator(scope.Projects, new VulnerabilitySuppressionRepository(scope.Context),
                    scope.CommitScopeFactory, new DashboardCache(new MemoryCache(new MemoryCacheOptions()))),
                new ScanFollowUpService(
                    new FindingTicketSyncService(scope.Tickets, new TicketHistoryRepository(scope.Context),
                        scope.CommitScopeFactory, new FakeAuditLogService(),
                        NullLogger<FindingTicketSyncService>.Instance),
                    new CriticalVulnerabilityTicketService(scope.Tickets, scope.Organizations, scope.Users,
                        scope.CommitScopeFactory, TestLocalizer.Create(), new FakeAuditLogService(),
                        NullLogger<CriticalVulnerabilityTicketService>.Instance),
                    new VulnerabilityAlertService(scope.Organizations, scope.Users, new NoopJobScheduler(),
                        Options.Create(new FrontendSettings()), NullLogger<VulnerabilityAlertService>.Instance),
                    new FakeAuditLogService(),
                    new DashboardCache(new MemoryCache(new MemoryCacheOptions())),
                    new NoopNotifier()),
                new NoopNotifier(),
                scope.SystemScope,
                new DatabaseConnectionHolder(scope.Context),
                new ProjectScanGate(),
                NullLogger<ProjectScanService>.Instance);
        }

        public PostgresScope Scope { get; }
        public FakeHost Host { get; } = new();
        public FakeRegistry Registry { get; } = new();
        public FakeFeed Feed { get; } = new();
        public ProjectScanService Service { get; }
        public Project Project { get; private set; } = null!;

        public static async Task<Harness> CreateAsync(PostgresFixture fixture)
        {
            Harness harness = new Harness(new PostgresScope(fixture));

            Project project = harness.Scope.NewProject();
            project.RepositoryUrl = "https://github.com/acme/app";
            project.RepositoryType = RepositoryType.GitHub;
            project.ScanFrequency = ScanFrequency.Weekly;

            await harness.Scope.SeedAsync(harness.Scope.NewOrganization(), project);

            harness.Project = project;

            return harness;
        }

        public Task ScanAsync() =>
            Service.ScanProjectAsync(Project.Id, TestContext.Current.CancellationToken);

        public async Task<Project> ReloadAsync()
        {
            Scope.Context.ChangeTracker.Clear();

            using IDisposable elevation = Scope.SystemScope.Enter();

            return await Scope.Context.Projects
                .Include(p => p.Dependencies).ThenInclude(d => d.Vulnerabilities)
                .Include(p => p.Runtimes)
                .AsNoTracking()
                .FirstAsync(p => p.Id == Project.Id, TestContext.Current.CancellationToken);
        }

        public ValueTask DisposeAsync() => Scope.DisposeAsync();
    }

    [Fact]
    public async Task Scan_PremierPassage_EnregistreInventaireScoreEtSha()
    {
        _fixture.EnsureAvailable();

        await using Harness harness = await Harness.CreateAsync(_fixture);

        await harness.ScanAsync();

        Project scanned = await harness.ReloadAsync();

        scanned.Dependencies.Should().ContainSingle().Which.Name.Should().Be("axios");
        scanned.Coverage.Should().Be(ScanCoverage.Covered);
        scanned.LastScanAt.Should().NotBeNull();
        scanned.LastScanError.Should().BeNull();
        scanned.LastScannedCommitSha.Should().Be("sha-1");
        scanned.HealthScore.Should().NotBeNull();
        harness.Host.LastRequestedSha.Should().Be("sha-1");
    }

    [Fact]
    public async Task Scan_DepotInchange_SauteLaLectureDesManifestesMaisRafraichitLesVersions()
    {
        _fixture.EnsureAvailable();

        await using Harness harness = await Harness.CreateAsync(_fixture);

        await harness.ScanAsync();
        int registryCallsAfterFirstScan = harness.Registry.Calls;

        await harness.ScanAsync();

        harness.Host.ListFilesCalls.Should().Be(1);
        harness.Registry.Calls.Should().Be(registryCallsAfterFirstScan + 1);

        Project scanned = await harness.ReloadAsync();
        scanned.Dependencies.Should().ContainSingle();
        scanned.Coverage.Should().Be(ScanCoverage.Covered);
    }

    [Fact]
    public async Task Scan_NouveauCommit_RelitLesManifestes()
    {
        _fixture.EnsureAvailable();

        await using Harness harness = await Harness.CreateAsync(_fixture);

        await harness.ScanAsync();

        harness.Host.HeadCommitSha = "sha-2";
        harness.Host.ManifestContent = """{ "dependencies": { "axios": "1.7.0" } }""";

        await harness.ScanAsync();

        harness.Host.ListFilesCalls.Should().Be(2);

        Project scanned = await harness.ReloadAsync();
        scanned.LastScannedCommitSha.Should().Be("sha-2");
        scanned.Dependencies.Should().ContainSingle().Which.CurrentVersion.Should().Be("1.7.0");
    }

    [Fact]
    public async Task Scan_NouveauCommitSansChangementDeDependance_ConserveLesLignesEtLesVulnerabilites()
    {
        _fixture.EnsureAvailable();

        await using Harness harness = await Harness.CreateAsync(_fixture);

        harness.Feed.ReportedIds = ["GHSA-1"];
        harness.Feed.Advisories["GHSA-1"] = new VulnerabilityAdvisory("GHSA-1", 9.8m,
            VulnerabilitySeverity.Critical, "boom",
            new Dictionary<string, string> { ["axios"] = "1.6.8" });

        await harness.ScanAsync();

        Project first = await harness.ReloadAsync();
        Dependency firstDependency = first.Dependencies.Should().ContainSingle().Subject;
        Vulnerability firstVulnerability = firstDependency.Vulnerabilities.Should().ContainSingle().Subject;

        harness.Host.HeadCommitSha = "sha-2";

        await harness.ScanAsync();

        Project second = await harness.ReloadAsync();
        Dependency secondDependency = second.Dependencies.Should().ContainSingle().Subject;

        secondDependency.Id.Should().Be(firstDependency.Id);
        secondDependency.Vulnerabilities.Should().ContainSingle()
            .Which.Id.Should().Be(firstVulnerability.Id);
        second.LastScannedCommitSha.Should().Be("sha-2");
    }

    [Fact]
    public async Task Scan_DepotInaccessible_ConserveLInventaireEtRemonteLErreur()
    {
        _fixture.EnsureAvailable();

        await using Harness harness = await Harness.CreateAsync(_fixture);

        await harness.ScanAsync();

        harness.Host.HeadCommitSha = "sha-2";
        harness.Host.ListingFails = true;

        await harness.ScanAsync();

        Project scanned = await harness.ReloadAsync();
        scanned.Dependencies.Should().ContainSingle();
        scanned.Coverage.Should().Be(ScanCoverage.Covered);
        scanned.LastScanError.Should().Be(ErrorCodes.ScanNoAccessibleFiles);
        scanned.LastScannedCommitSha.Should().Be("sha-1");
    }

    [Fact]
    public async Task Scan_DonneesVulnsIncompletes_SontRemonteesSurLeProjet()
    {
        _fixture.EnsureAvailable();

        await using Harness harness = await Harness.CreateAsync(_fixture);

        harness.Feed.IsComplete = false;

        await harness.ScanAsync();

        Project scanned = await harness.ReloadAsync();
        scanned.LastScanError.Should().Be(ErrorCodes.ScanVulnerabilityDataIncomplete);
        scanned.Coverage.Should().Be(ScanCoverage.Covered);
    }

    [Fact]
    public async Task Scan_VulnerabiliteSignalee_EstEnregistreeEtBaisseLeScore()
    {
        _fixture.EnsureAvailable();

        await using Harness harness = await Harness.CreateAsync(_fixture);

        harness.Feed.ReportedIds = ["GHSA-1"];
        harness.Feed.Advisories["GHSA-1"] = new VulnerabilityAdvisory("GHSA-1", 9.8m,
            VulnerabilitySeverity.Critical, "boom",
            new Dictionary<string, string> { ["axios"] = "1.6.8" });

        await harness.ScanAsync();

        Project scanned = await harness.ReloadAsync();
        Dependency dependency = scanned.Dependencies.Should().ContainSingle().Subject;

        dependency.Status.Should().Be(DependencyStatus.Vulnerable);
        dependency.Vulnerabilities.Should().ContainSingle()
            .Which.FixedVersion.Should().Be("1.6.8");
        scanned.HealthScore.Should().BeLessThan(100);
    }

    [Fact]
    public async Task Scan_ProjetEvalue_EnregistreLInstantaneDuScoreDuJour()
    {
        _fixture.EnsureAvailable();

        await using Harness harness = await Harness.CreateAsync(_fixture);

        await harness.ScanAsync();
        await harness.ScanAsync();

        Project scanned = await harness.ReloadAsync();

        using IDisposable elevation = harness.Scope.SystemScope.Enter();

        List<ProjectHealthSnapshot> snapshots = await harness.Scope.Context.ProjectHealthSnapshots
            .AsNoTracking()
            .Where(s => s.ProjectId == scanned.Id)
            .ToListAsync(TestContext.Current.CancellationToken);

        ProjectHealthSnapshot snapshot = snapshots.Should().ContainSingle().Subject;
        snapshot.Score.Should().Be(scanned.HealthScore);
        snapshot.Grade.Should().Be(scanned.HealthGrade);
        snapshot.Day.Should().Be(DateOnly.FromDateTime(DateTime.UtcNow));
        snapshot.OrganizationId.Should().Be(scanned.OrganizationId);
    }

    [Fact]
    public async Task Scan_VulnerabiliteDisparue_EstJournaliseeCommeCorrigee()
    {
        _fixture.EnsureAvailable();

        await using Harness harness = await Harness.CreateAsync(_fixture);

        harness.Feed.ReportedIds = ["GHSA-1"];
        harness.Feed.Advisories["GHSA-1"] = new VulnerabilityAdvisory("GHSA-1", 9.8m,
            VulnerabilitySeverity.Critical, "boom",
            new Dictionary<string, string> { ["axios"] = "1.6.8" });

        await harness.ScanAsync();

        harness.Feed.ReportedIds = [];

        await harness.ScanAsync();

        using IDisposable elevation = harness.Scope.SystemScope.Enter();

        List<VulnerabilityResolution> resolutions = await harness.Scope.Context.VulnerabilityResolutions
            .AsNoTracking()
            .Where(r => r.ProjectId == harness.Project.Id)
            .ToListAsync(TestContext.Current.CancellationToken);

        VulnerabilityResolution resolution = resolutions.Should().ContainSingle().Subject;
        resolution.CveId.Should().Be("GHSA-1");
        resolution.ResolvedAt.Should().BeOnOrAfter(resolution.DetectedAt);
    }
}
