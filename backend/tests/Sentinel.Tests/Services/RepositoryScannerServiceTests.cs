using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Sentinel.Application.TechHealth.Scan;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;

namespace Sentinel.Tests.Services;

public class RepositoryScannerServiceTests
{
    private sealed class FakeRepositoryHost(Dictionary<string, string> filesByUrl, string? headCommitSha = null,
        bool truncated = false) : IRepositoryHostClient
    {
        public Task<RepositoryListing> ListUserRepositoriesAsync(string token, string platform) =>
            throw new NotSupportedException();

        public Task<(string Id, string Login)?> GetAuthenticatedAccountAsync(string token, string platform) =>
            throw new NotSupportedException();

        public Task<string?> GetHeadCommitAsync(string host, string owner, string repo,
            string? tokenOverride = null) =>
            Task.FromResult(headCommitSha);

        public string? RequestedCommitSha { get; private set; }

        public Task<RepositoryFileListing> ListFilesAsync(string host, string owner, string repo,
            string? tokenOverride = null, string? commitSha = null)
        {
            RequestedCommitSha = commitSha;

            return Task.FromResult(new RepositoryFileListing(
                filesByUrl.Keys.Select(url => (Path.GetFileName(url), url)).ToList(), truncated));
        }

        public Task<string?> FetchTextAsync(string host, string url, string? tokenOverride = null) =>
            Task.FromResult(filesByUrl.TryGetValue(url, out string? content) ? content : null);
    }

    private sealed class NoopRegistry : IDependencyRegistryClient
    {
        public Task FetchLatestVersionsAsync(List<Dependency> dependencies) => Task.CompletedTask;
    }

    private static Task<ScanOutcome> ScanAsync(Dictionary<string, string> filesByUrl)
    {
        RepositoryScannerService scanner = new RepositoryScannerService(
            new FakeRepositoryHost(filesByUrl),
            new ManifestParserService(),
            new NoopRegistry(),
            NullLogger<RepositoryScannerService>.Instance);

        return scanner.ScanRepositoryAsync(Guid.NewGuid(), "https://github.com/acme/app");
    }

    [Fact]
    public async Task ScanRepository_SamePackageNameInTwoEcosystems_KeepsBoth()
    {
        ScanOutcome outcome = await ScanAsync(new Dictionary<string, string>
        {
            ["https://host/package.json"] = """{ "dependencies": { "redis": "4.6.13" } }""",
            ["https://host/requirements.txt"] = "redis==5.0.3",
        });

        outcome.Dependencies.Should().HaveCount(2);
        outcome.Dependencies.Select(dependency => dependency.Ecosystem)
            .Should().BeEquivalentTo([DependencyEcosystem.Npm, DependencyEcosystem.PyPI]);
    }

    [Fact]
    public async Task ScanRepository_MonorepoWithDivergingVersions_KeepsEveryVersion()
    {
        ScanOutcome outcome = await ScanAsync(new Dictionary<string, string>
        {
            ["https://host/apps/web/package.json"] = """{ "dependencies": { "axios": "1.6.8" } }""",
            ["https://host/apps/api/package.json"] = """{ "dependencies": { "axios": "0.27.2" } }""",
        });

        outcome.Dependencies.Should().HaveCount(2);
        outcome.Dependencies.Select(dependency => dependency.CurrentVersion)
            .Should().BeEquivalentTo(["1.6.8", "0.27.2"]);
    }

    [Fact]
    public async Task ScanRepository_SameVersionInSeveralModules_IsDeduplicated()
    {
        ScanOutcome outcome = await ScanAsync(new Dictionary<string, string>
        {
            ["https://host/apps/web/package.json"] = """{ "dependencies": { "axios": "1.6.8" } }""",
            ["https://host/apps/api/package.json"] = """{ "dependencies": { "axios": "1.6.8" } }""",
        });

        outcome.Dependencies.Should().ContainSingle();
    }

    [Fact]
    public async Task ScanRepository_ProdAndDevDeclaration_KeepsProd()
    {
        ScanOutcome outcome = await ScanAsync(new Dictionary<string, string>
        {
            ["https://host/apps/web/package.json"] = """{ "devDependencies": { "axios": "1.6.8" } }""",
            ["https://host/apps/api/package.json"] = """{ "dependencies": { "axios": "1.6.8" } }""",
        });

        outcome.Dependencies.Should().ContainSingle()
            .Which.Type.Should().Be(DependencyType.Prod);
    }

    [Fact]
    public async Task ScanRepository_LockFile_OverridesTheManifestRangeOfItsOwnEcosystem()
    {
        ScanOutcome outcome = await ScanAsync(new Dictionary<string, string>
        {
            ["https://host/package.json"] = """{ "dependencies": { "axios": "^1.6.0" } }""",
            ["https://host/package-lock.json"] = """
            {
              "lockfileVersion": 3,
              "packages": { "node_modules/axios": { "version": "1.6.8" } }
            }
            """,
        });

        outcome.Dependencies.Should().ContainSingle()
            .Which.CurrentVersion.Should().Be("1.6.8");
    }

    [Fact]
    public async Task ScanRepository_LockFile_DoesNotHideTheSameNameInAnotherEcosystem()
    {
        ScanOutcome outcome = await ScanAsync(new Dictionary<string, string>
        {
            ["https://host/package-lock.json"] = """
            {
              "lockfileVersion": 3,
              "packages": { "node_modules/redis": { "version": "4.6.13" } }
            }
            """,
            ["https://host/requirements.txt"] = "redis==5.0.3",
        });

        outcome.Dependencies.Should().HaveCount(2);
    }

    [Fact]
    public async Task ScanRepository_SameRuntimeDeclaredTwice_KeepsOneEntryPerVersion()
    {
        ScanOutcome outcome = await ScanAsync(new Dictionary<string, string>
        {
            ["https://host/apps/web/package.json"] = """{ "engines": { "node": "20.11.0" } }""",
            ["https://host/apps/api/package.json"] = """{ "engines": { "node": "18.19.0" } }""",
            ["https://host/tools/package.json"] = """{ "engines": { "node": "20.11.0" } }""",
        });

        outcome.Runtimes.Should().HaveCount(2);
        outcome.Runtimes.Select(runtime => runtime.Version).Should().BeEquivalentTo(["20.11.0", "18.19.0"]);
    }

    [Fact]
    public async Task ScanRepository_NoAccessibleFile_ReportsTheDedicatedError()
    {
        ScanOutcome outcome = await ScanAsync(new Dictionary<string, string>());

        outcome.Error.Should().Be(ErrorCodes.ScanNoAccessibleFiles);
        outcome.Dependencies.Should().BeEmpty();
    }

    [Fact]
    public async Task ScanRepository_InvalidUrl_ReportsTheDedicatedError()
    {
        RepositoryScannerService scanner = new RepositoryScannerService(
            new FakeRepositoryHost(new Dictionary<string, string>()),
            new ManifestParserService(),
            new NoopRegistry(),
            NullLogger<RepositoryScannerService>.Instance);

        ScanOutcome outcome = await scanner.ScanRepositoryAsync(Guid.NewGuid(), "not-a-url");

        outcome.Error.Should().Be(ErrorCodes.ScanInvalidRepositoryUrl);
    }

    [Fact]
    public async Task ScanRepository_LockFileDependency_InheritsTheTypeDeclaredInTheManifest()
    {
        ScanOutcome outcome = await ScanAsync(new Dictionary<string, string>
        {
            ["https://host/package.json"] = """
            { "dependencies": { "axios": "^1.6.0" }, "devDependencies": { "vitest": "^3.0.0" } }
            """,
            ["https://host/yarn.lock"] = """
            axios@^1.6.0:
              version "1.6.8"

            vitest@^3.0.0:
              version "3.0.1"

            tinybench@^2.0.0:
              version "2.9.0"
            """,
        });

        outcome.Dependencies.Should().HaveCount(3);
        outcome.Dependencies.Single(d => d.Name == "axios").Type.Should().Be(DependencyType.Prod);
        outcome.Dependencies.Single(d => d.Name == "vitest").Type.Should().Be(DependencyType.Dev);
        outcome.Dependencies.Single(d => d.Name == "tinybench").Type.Should().Be(DependencyType.Prod);
    }

    [Fact]
    public async Task ScanRepository_ManifestDeclaringBothTypes_KeepsProdForTheLockEntry()
    {
        ScanOutcome outcome = await ScanAsync(new Dictionary<string, string>
        {
            ["https://host/apps/web/package.json"] = """{ "devDependencies": { "axios": "^1.6.0" } }""",
            ["https://host/apps/api/package.json"] = """{ "dependencies": { "axios": "^1.6.0" } }""",
            ["https://host/yarn.lock"] = """
            axios@^1.6.0:
              version "1.6.8"
            """,
        });

        outcome.Dependencies.Should().ContainSingle()
            .Which.Type.Should().Be(DependencyType.Prod);
    }

    [Fact]
    public async Task ScanRepository_UsesTheRequestedCommitSha()
    {
        FakeRepositoryHost host = new FakeRepositoryHost(new Dictionary<string, string>
        {
            ["https://host/package.json"] = """{ "dependencies": { "axios": "1.6.8" } }""",
        });

        RepositoryScannerService scanner = new RepositoryScannerService(host, new ManifestParserService(),
            new NoopRegistry(), NullLogger<RepositoryScannerService>.Instance);

        await scanner.ScanRepositoryAsync(Guid.NewGuid(), "https://github.com/acme/app", null, "abc123");

        host.RequestedCommitSha.Should().Be("abc123");
    }

    [Fact]
    public async Task ScanRepository_CompleteListing_ReportsNoWarning()
    {
        ScanOutcome outcome = await ScanAsync(new Dictionary<string, string>
        {
            ["https://host/package.json"] = """{ "dependencies": { "axios": "1.6.8" } }""",
        });

        outcome.Warning.Should().BeNull();
    }

    [Fact]
    public async Task ScanRepository_TruncatedListing_ReportsPartialCoverage()
    {
        RepositoryScannerService scanner = new RepositoryScannerService(
            new FakeRepositoryHost(
                new Dictionary<string, string>
                {
                    ["https://host/package.json"] = """{ "dependencies": { "axios": "1.6.8" } }""",
                },
                truncated: true),
            new ManifestParserService(),
            new NoopRegistry(),
            NullLogger<RepositoryScannerService>.Instance);

        ScanOutcome outcome = await scanner.ScanRepositoryAsync(Guid.NewGuid(), "https://github.com/acme/app");

        outcome.Warning.Should().Be(ScanWarningCodes.RepositoryTruncated);
        outcome.Dependencies.Should().ContainSingle();
    }

    [Fact]
    public async Task ScanRepository_UnreadableManifest_ReportsPartialCoverage()
    {
        ScanOutcome outcome = await ScanAsync(new Dictionary<string, string>
        {
            ["https://host/package.json"] = """{ "dependencies": { "axios": "1.6.8" } }""",
            ["https://host/apps/api/package.json"] = null!,
        });

        outcome.Warning.Should().Be(ScanWarningCodes.ManifestUnreadable);
        outcome.Dependencies.Should().ContainSingle();
    }

    [Fact]
    public async Task GetHeadCommit_ReturnsTheShaReportedByTheHost()
    {
        RepositoryScannerService scanner = new RepositoryScannerService(
            new FakeRepositoryHost(new Dictionary<string, string>(), headCommitSha: "abc123"),
            new ManifestParserService(),
            new NoopRegistry(),
            NullLogger<RepositoryScannerService>.Instance);

        string? sha = await scanner.GetHeadCommitAsync("https://github.com/acme/app");

        sha.Should().Be("abc123");
    }

    [Fact]
    public async Task GetHeadCommit_InvalidUrl_ReturnsNull()
    {
        RepositoryScannerService scanner = new RepositoryScannerService(
            new FakeRepositoryHost(new Dictionary<string, string>(), headCommitSha: "abc123"),
            new ManifestParserService(),
            new NoopRegistry(),
            NullLogger<RepositoryScannerService>.Instance);

        string? sha = await scanner.GetHeadCommitAsync("not-a-url");

        sha.Should().BeNull();
    }

    [Fact]
    public async Task RefreshVersions_RecomputesTheStatusFromTheRegistry()
    {
        Dependency dependency = new Dependency
        {
            Name = "axios",
            CurrentVersion = "1.0.0",
            Ecosystem = DependencyEcosystem.Npm,
            Status = DependencyStatus.Vulnerable,
        };

        RepositoryScannerService scanner = new RepositoryScannerService(
            new FakeRepositoryHost(new Dictionary<string, string>()),
            new ManifestParserService(),
            new StubRegistry("2.0.0"),
            NullLogger<RepositoryScannerService>.Instance);

        await scanner.RefreshVersionsAsync([dependency]);

        dependency.LatestVersion.Should().Be("2.0.0");
        dependency.Status.Should().Be(DependencyStatus.MajorUpdate);
    }

    private sealed class StubRegistry(string latestVersion) : IDependencyRegistryClient
    {
        public Task FetchLatestVersionsAsync(List<Dependency> dependencies)
        {
            foreach (Dependency dependency in dependencies) dependency.LatestVersion = latestVersion;

            return Task.CompletedTask;
        }
    }

    [Fact]
    public async Task ScanRepository_CountsOnlyTheManifestsActuallyRead()
    {
        ScanOutcome outcome = await ScanAsync(new Dictionary<string, string>
        {
            ["https://host/package.json"] = """{ "dependencies": { "axios": "1.6.8" } }""",
            ["https://host/README.md"] = "# not a manifest",
        });

        outcome.ManifestsRead.Should().Be(1);
    }
}
