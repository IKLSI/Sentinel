using System.Linq.Expressions;
using FluentAssertions;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Sentinel.Application.Billing;
using Sentinel.Application.Dashboard;
using Sentinel.Application.Options;
using Sentinel.Application.Security;
using Sentinel.Application.TechHealth.Scan;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Realtime;
using Sentinel.Domain.TechHealth;
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

        public Task<RepositoryListing> ListUserRepositoriesAsync(string token, string platform) =>
            throw new NotSupportedException();

        public Task<(string Id, string Login)?> GetAuthenticatedAccountAsync(string token, string platform) =>
            throw new NotSupportedException();

        public Task<string?> GetHeadCommitAsync(string host, string owner, string repo, string? token = null) =>
            Task.FromResult<string?>(HeadCommitSha);

        public Task<RepositoryFileListing> ListFilesAsync(string host, string owner, string repo,
            string? token = null, string? commitSha = null)
        {
            ListFilesCalls++;
            LastRequestedSha = commitSha;

            return Task.FromResult(ListingFails
                ? new RepositoryFileListing([], false)
                : new RepositoryFileListing([("package.json", "https://host/package.json")], false));
        }

        public Task<string?> FetchTextAsync(string host, string url, string? token = null) =>
            Task.FromResult<string?>(ManifestContent);
    }

    private sealed class FakeRegistry : IDependencyRegistryClient
    {
        public int Calls { get; private set; }
        public string? LatestVersion { get; set; } = "1.6.0";

        public Task FetchLatestVersionsAsync(List<Dependency> dependencies)
        {
            Calls++;
            foreach (Dependency dependency in dependencies) dependency.LatestVersion = LatestVersion;

            return Task.CompletedTask;
        }
    }

    private sealed class FakeFeed : IVulnerabilityFeedClient
    {
        public List<string> ReportedIds { get; set; } = [];
        public bool IsComplete { get; set; } = true;
        public Dictionary<string, VulnerabilityAdvisory> Advisories { get; } = new();

        public Task<VulnerabilityQueryResult> QueryAsync(IReadOnlyList<VulnerabilityQuery> queries) =>
            Task.FromResult(new VulnerabilityQueryResult(
                queries.Select(_ => (IReadOnlyList<string>?)ReportedIds).ToList(), IsComplete));

        public Task<IReadOnlyDictionary<string, VulnerabilityAdvisory>> GetAdvisoriesAsync(
            IReadOnlyCollection<string> advisoryIds) =>
            Task.FromResult<IReadOnlyDictionary<string, VulnerabilityAdvisory>>(Advisories);
    }

    private sealed class NoopLifecycle : IRuntimeLifecycleClient
    {
        public Task<RuntimeLifecycle?> GetLifecycleAsync(string runtimeName, string version) =>
            Task.FromResult<RuntimeLifecycle?>(null);
    }

    private sealed class NoopJobScheduler : IJobScheduler
    {
        public void Enqueue<TJob>(Expression<Func<TJob, Task>> methodCall) { }

        public void TriggerRecurring(string recurringJobId) { }
    }

    private sealed class NoopNotifier : IRealtimeNotifier
    {
        public Task NotifyOrganizationAsync(Guid organizationId, RealtimeEvent notification,
            CancellationToken cancellationToken) => Task.CompletedTask;

        public Task NotifyAllAsync(RealtimeEvent notification, CancellationToken cancellationToken) =>
            Task.CompletedTask;
    }

    private sealed class Harness : IAsyncDisposable
    {
        private Harness(PostgresScope scope)
        {
            Scope = scope;

            VulnerabilityRepository vulnerabilities = new VulnerabilityRepository(scope.Context);

            Service = new ProjectScanService(
                scope.Projects,
                scope.Organizations,
                vulnerabilities,
                new RepositoryScannerService(Host, new ManifestParserService(), Registry,
                    NullLogger<RepositoryScannerService>.Instance),
                new VulnerabilityScanService(Feed),
                new RuntimeEolScanService(new NoopLifecycle()),
                new VulnerabilityAlertService(scope.Organizations, scope.Users, new NoopJobScheduler(),
                    Options.Create(new FrontendSettings()), NullLogger<VulnerabilityAlertService>.Instance),
                new ProjectInventoryWriter(new DependencyRepository(scope.Context), vulnerabilities,
                    new RuntimeRepository(scope.Context), scope.CommitScopeFactory),
                new QuotaGuard(scope.Organizations, scope.Projects, scope.Users,
                    new UserInvitationRepository(scope.Context), scope.SystemScope),
                new TokenProtector(new EphemeralDataProtectionProvider(), NullLogger<TokenProtector>.Instance),
                new DashboardCache(new MemoryCache(new MemoryCacheOptions())),
                new NoopNotifier(),
                scope.SystemScope,
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
            Service.ScanProjectWithReservedQuotaAsync(Project.Id, Project.OrganizationId);

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
}
