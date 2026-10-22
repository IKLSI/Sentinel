using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Sentinel.Application.TechHealth.Scan;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Git;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;

namespace Sentinel.Tests.Services;

public class RepositoryScannerServiceTests
{
    private sealed class FakeRepositoryHost(Dictionary<string, string> filesByUrl, string? headCommitSha = null,
        bool truncated = false)
        : IRepositoryHostClient
    {
        public Task<RepositoryListing> ListUserRepositoriesAsync(string token, string platform,
            GitLabInstance gitLab, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<(string Id, string Login)?> GetAuthenticatedAccountAsync(string token, string platform,
            GitLabInstance gitLab, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<string?> GetHeadCommitAsync(string host, string owner, string repo,
            RepositoryAccess? access, string? branch, CancellationToken cancellationToken) =>
            Task.FromResult(headCommitSha);

        public Task<RepositoryBranchListing?> ListBranchesAsync(string host, string owner, string repo,
            RepositoryAccess? access, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public string? RequestedCommitSha { get; private set; }

        public Task<RepositoryFileListing> ListFilesAsync(string host, string owner, string repo,
            RepositoryAccess? access, string? commitSha, CancellationToken cancellationToken)
        {
            RequestedCommitSha = commitSha;

            return Task.FromResult(new RepositoryFileListing(
                filesByUrl.Keys.Select(url => (Path.GetFileName(url), url, new Uri(url).AbsolutePath.TrimStart('/')))
                    .ToList(), truncated));
        }

        public Task<string?> FetchTextAsync(string host, string url, RepositoryAccess? access, CancellationToken cancellationToken) =>
            Task.FromResult(filesByUrl.TryGetValue(url, out string? content) ? content : null);

        public Task<string?> FindMergeRequestUrlAsync(string host, string owner, string repo,
            RepositoryAccess access, string sourceBranch, CancellationToken cancellationToken) =>
            Task.FromResult<string?>(null);
    }

    private sealed class NoopRegistry : IDependencyRegistryClient
    {
        public Task<IReadOnlyDictionary<RegistryPackageQuery, RegistryPackageMetadata>> GetMetadataAsync(
            IReadOnlyCollection<RegistryPackageQuery> packages, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyDictionary<RegistryPackageQuery, RegistryPackageMetadata>>(
                new Dictionary<RegistryPackageQuery, RegistryPackageMetadata>());
    }

    private static Task<ScanOutcome> ScanAsync(Dictionary<string, string> filesByUrl)
    {
        RepositoryScannerService scanner = new RepositoryScannerService(
            new FakeRepositoryHost(filesByUrl),
            new ManifestParserService(),
            new RegistryMetadataApplier(new NoopRegistry()),
            NullLogger<RepositoryScannerService>.Instance);

        return scanner.ScanRepositoryAsync(Guid.NewGuid(), "https://github.com/acme/app", null, null, null,
            TestContext.Current.CancellationToken);
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
            new RegistryMetadataApplier(new NoopRegistry()),
            NullLogger<RepositoryScannerService>.Instance);

        ScanOutcome outcome = await scanner.ScanRepositoryAsync(Guid.NewGuid(), "not-a-url", null, null, null,
            TestContext.Current.CancellationToken);

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
    public async Task ScanRepository_LockEntryAbsentFromTheManifest_IsTransitive()
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

        outcome.Dependencies.Single(d => d.Name == "axios").IsDirect.Should().BeTrue();
        outcome.Dependencies.Single(d => d.Name == "vitest").IsDirect.Should().BeTrue();
        outcome.Dependencies.Single(d => d.Name == "tinybench").IsDirect.Should().BeFalse();
    }

    [Fact]
    public async Task ScanRepository_LockFileWithoutManifestOfItsEcosystem_MarksEntriesTransitive()
    {
        ScanOutcome outcome = await ScanAsync(new Dictionary<string, string>
        {
            ["https://host/yarn.lock"] = """
            tinybench@^2.0.0:
              version "2.9.0"
            """,
        });

        outcome.Dependencies.Should().ContainSingle().Which.IsDirect.Should().BeFalse();
    }

    [Fact]
    public async Task ScanRepository_PackageLockWithoutManifest_KeepsTheDirectnessItDeclares()
    {
        ScanOutcome outcome = await ScanAsync(new Dictionary<string, string>
        {
            ["https://host/package-lock.json"] = """
            {
              "lockfileVersion": 3,
              "packages": {
                "": { "dependencies": { "axios": "^1.6.0" } },
                "node_modules/axios": { "version": "1.6.8" },
                "node_modules/follow-redirects": { "version": "1.15.6" }
              }
            }
            """,
        });

        outcome.Dependencies.Single(dependency => dependency.Name == "axios").IsDirect.Should().BeTrue();
        outcome.Dependencies.Single(dependency => dependency.Name == "follow-redirects").IsDirect.Should().BeFalse();
    }

    [Fact]
    public async Task ScanRepository_PythonNamesWithDifferentSeparators_AreDeduplicated()
    {
        ScanOutcome outcome = await ScanAsync(new Dictionary<string, string>
        {
            ["https://host/requirements.txt"] = "python_dateutil==2.9.0",
            ["https://host/Pipfile.lock"] = """
            { "default": { "python-dateutil": { "version": "==2.9.0" } }, "develop": {} }
            """,
        });

        outcome.Dependencies.Should().ContainSingle().Which.IsDirect.Should().BeTrue();
    }

    [Fact]
    public async Task ScanRepository_PythonLockEntry_MatchesTheManifestDespiteNameSeparators()
    {
        ScanOutcome outcome = await ScanAsync(new Dictionary<string, string>
        {
            ["https://host/requirements.txt"] = "Typing_Extensions==4.12.0",
            ["https://host/poetry.lock"] = """
            [[package]]
            name = "typing-extensions"
            version = "4.12.2"

            [[package]]
            name = "idna"
            version = "3.7"
            """,
        });

        outcome.Dependencies.Single(d => d.Name == "typing-extensions").IsDirect.Should().BeTrue();
        outcome.Dependencies.Single(d => d.Name == "idna").IsDirect.Should().BeFalse();
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
            new RegistryMetadataApplier(new NoopRegistry()), NullLogger<RepositoryScannerService>.Instance);

        await scanner.ScanRepositoryAsync(Guid.NewGuid(), "https://github.com/acme/app", null, "abc123", null,
            TestContext.Current.CancellationToken);

        host.RequestedCommitSha.Should().Be("abc123");
    }

    [Fact]
    public async Task ScanRepository_UnreadableManifest_KeepsTheReadableDependencies()
    {
        ScanOutcome outcome = await ScanAsync(new Dictionary<string, string>
        {
            ["https://host/package.json"] = """{ "dependencies": { "axios": "1.6.8" } }""",
            ["https://host/apps/api/package.json"] = null!,
        });

        outcome.Dependencies.Should().ContainSingle();
        outcome.IsComplete.Should().BeFalse();
    }

    [Fact]
    public async Task ScanRepository_EveryManifestRead_IsComplete()
    {
        ScanOutcome outcome = await ScanAsync(new Dictionary<string, string>
        {
            ["https://host/package.json"] = """{ "dependencies": { "axios": "1.6.8" } }""",
        });

        outcome.IsComplete.Should().BeTrue();
    }

    [Fact]
    public async Task ScanRepository_TruncatedListing_IsIncomplete()
    {
        RepositoryScannerService scanner = new RepositoryScannerService(
            new FakeRepositoryHost(new Dictionary<string, string>
            {
                ["https://host/package.json"] = """{ "dependencies": { "axios": "1.6.8" } }""",
            }, truncated: true),
            new ManifestParserService(),
            new RegistryMetadataApplier(new NoopRegistry()),
            NullLogger<RepositoryScannerService>.Instance);

        ScanOutcome outcome = await scanner.ScanRepositoryAsync(Guid.NewGuid(), "https://github.com/acme/app", null, null, null,
            TestContext.Current.CancellationToken);

        outcome.IsComplete.Should().BeFalse();
    }

    [Fact]
    public async Task GetHeadCommit_ReturnsTheShaReportedByTheHost()
    {
        RepositoryScannerService scanner = new RepositoryScannerService(
            new FakeRepositoryHost(new Dictionary<string, string>(), headCommitSha: "abc123"),
            new ManifestParserService(),
            new RegistryMetadataApplier(new NoopRegistry()),
            NullLogger<RepositoryScannerService>.Instance);

        string? sha = await scanner.GetHeadCommitAsync("https://github.com/acme/app", null, null,
            TestContext.Current.CancellationToken);

        sha.Should().Be("abc123");
    }

    [Fact]
    public async Task GetHeadCommit_InvalidUrl_ReturnsNull()
    {
        RepositoryScannerService scanner = new RepositoryScannerService(
            new FakeRepositoryHost(new Dictionary<string, string>(), headCommitSha: "abc123"),
            new ManifestParserService(),
            new RegistryMetadataApplier(new NoopRegistry()),
            NullLogger<RepositoryScannerService>.Instance);

        string? sha = await scanner.GetHeadCommitAsync("not-a-url", null, null, TestContext.Current.CancellationToken);

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
            new RegistryMetadataApplier(new StubRegistry("2.0.0")),
            NullLogger<RepositoryScannerService>.Instance);

        await scanner.RefreshVersionsAsync([dependency], TestContext.Current.CancellationToken);

        dependency.LatestVersion.Should().Be("2.0.0");
        dependency.Status.Should().Be(DependencyStatus.MajorUpdate);
    }

    private sealed class StubRegistry(string latestVersion) : IDependencyRegistryClient
    {
        public Task<IReadOnlyDictionary<RegistryPackageQuery, RegistryPackageMetadata>> GetMetadataAsync(
            IReadOnlyCollection<RegistryPackageQuery> packages, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyDictionary<RegistryPackageQuery, RegistryPackageMetadata>>(
                packages.ToDictionary(package => package,
                    _ => new RegistryPackageMetadata(latestVersion, null, null, false)));
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

    [Fact]
    public async Task ScanRepository_Monorepo_MatchesEachManifestWithTheLockFileOfItsDirectory()
    {
        ScanOutcome outcome = await ScanAsync(new Dictionary<string, string>
        {
            ["https://host/apps/web/package.json"] = """{ "dependencies": { "react": "^18.2.0" } }""",
            ["https://host/apps/web/package-lock.json"] = """{ "lockfileVersion": 3, "packages": { "node_modules/react": { "version": "18.3.1" } } }""",
            ["https://host/apps/api/package.json"] = """{ "dependencies": { "react": "^17.0.0", "express": "4.19.2" } }""",
        });

        outcome.Dependencies.Select(d => (d.Name, d.CurrentVersion)).Should().BeEquivalentTo(
            [("react", "18.3.1"), ("react", "17.0.0"), ("express", "4.19.2")]);
        outcome.Dependencies.Single(d => d.CurrentVersion == "18.3.1").ManifestPath
            .Should().Be("apps/web/package-lock.json");
    }

    [Fact]
    public async Task ScanRepository_ExcludesFixturesAndExamples()
    {
        ScanOutcome outcome = await ScanAsync(new Dictionary<string, string>
        {
            ["https://host/package.json"] = """{ "dependencies": { "axios": "1.6.8" } }""",
            ["https://host/test/fixtures/package.json"] = """{ "dependencies": { "lodash": "4.17.15" } }""",
            ["https://host/examples/demo/package.json"] = """{ "dependencies": { "express": "4.0.0" } }""",
        });

        outcome.Dependencies.Should().ContainSingle().Which.Name.Should().Be("axios");
    }

    [Fact]
    public async Task ScanRepository_RootPath_RestrictsTheScanToTheSubfolder()
    {
        RepositoryScannerService scanner = new RepositoryScannerService(
            new FakeRepositoryHost(new Dictionary<string, string>
            {
                ["https://host/package.json"] = """{ "dependencies": { "axios": "1.6.8" } }""",
                ["https://host/services/billing/package.json"] = """{ "dependencies": { "stripe": "15.0.0" } }""",
            }),
            new ManifestParserService(),
            new RegistryMetadataApplier(new NoopRegistry()),
            NullLogger<RepositoryScannerService>.Instance);

        ScanOutcome outcome = await scanner.ScanRepositoryAsync(Guid.NewGuid(), "https://github.com/acme/app", null, null, new RepositoryScanScope(null, "/services/billing/"),
            TestContext.Current.CancellationToken);

        outcome.Dependencies.Should().ContainSingle().Which.Name.Should().Be("stripe");
    }
}
