using System.Net;
using System.Text;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Sentinel.Application.Common;
using Sentinel.Application.Deployments.Compare;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Git;
using Sentinel.Infrastructure.Http;

namespace Sentinel.Tests.Services;

public class ReleaseComparisonTests
{
    private const string AppSettings = "src/Api/appsettings.json";

    private static Dictionary<string, Dictionary<string, ConfigurationValue>> Configuration(string json) =>
        new() { [AppSettings] = ConfigurationDiff.Read("appsettings.json", json)! };

    [Fact]
    public void ConfigurationDiff_AddedKeyWithoutValue_RequiresAValue()
    {
        List<ConfigurationKeyChange> changes = ConfigurationDiff.Compare(
            Configuration("""{ "Smtp": { "Host": "smtp.local" } }"""),
            Configuration("""{ "Smtp": { "Host": "smtp.local", "ApiKey": "" }, "Exports": { "MaxRows": 5000 } }"""));

        changes.Should().BeEquivalentTo(new[]
        {
            new ConfigurationKeyChange(AppSettings, "Exports:MaxRows", ReleaseChangeKind.Added, false),
            new ConfigurationKeyChange(AppSettings, "Smtp:ApiKey", ReleaseChangeKind.Added, true)
        });
    }

    [Fact]
    public void ConfigurationDiff_ModifiedAndRemovedKeys_AreReportedWithoutExposingValues()
    {
        List<ConfigurationKeyChange> changes = ConfigurationDiff.Compare(
            Configuration("""{ "Exports": { "DateFormat": "dd/MM/yyyy" }, "Legacy": true }"""),
            Configuration("""{ "Exports": { "DateFormat": "yyyy-MM-dd" } }"""));

        changes.Should().BeEquivalentTo(new[]
        {
            new ConfigurationKeyChange(AppSettings, "Exports:DateFormat", ReleaseChangeKind.Modified, false),
            new ConfigurationKeyChange(AppSettings, "Legacy", ReleaseChangeKind.Removed, false)
        });
    }

    [Fact]
    public void ConfigurationDiff_ReadsCommentedJsonAndEnvironmentTemplates()
    {
        ConfigurationDiff.Read("appsettings.json", "{ // comment\n \"A\": 1, }").Should().ContainKey("A");
        ConfigurationDiff.Read(".env.example", "# comment\nexport API_URL=\nPORT=5000")
            .Should().BeEquivalentTo(new Dictionary<string, ConfigurationValue>
            {
                ["API_URL"] = new(true, ""),
                ["PORT"] = new(false, "5000")
            });
        ConfigurationDiff.Read("appsettings.json", "{ not json").Should().BeNull();
    }

    [Theory]
    [InlineData("appsettings.json", true)]
    [InlineData("appsettings.Production.json", true)]
    [InlineData(".env.example", true)]
    [InlineData("appsettings.Development.json", false)]
    [InlineData("appsettings.Local.json", false)]
    [InlineData("appsettings.Test.json", false)]
    public void ConfigurationDiff_IgnoresLocalEnvironmentFiles(string fileName, bool expected) =>
        ConfigurationDiff.IsConfigurationFile(fileName).Should().Be(expected);

    [Theory]
    [InlineData("src/Infrastructure/Migrations/20261021_DropLegacy.cs", true)]
    [InlineData("src/Infrastructure/Migrations/20261021_DropLegacy.Designer.cs", false)]
    [InlineData("src/Infrastructure/Migrations/SentinelContextModelSnapshot.cs", false)]
    [InlineData("db/migrations/V2__drop.sql", true)]
    [InlineData("src/Services/InvoiceService.cs", false)]
    public void MigrationInspector_RecognisesMigrationFiles(string path, bool expected)
    {
        MigrationInspector.IsMigrationFile(path).Should().Be(expected);
    }

    [Fact]
    public void MigrationInspector_EntityFrameworkDropInUp_IsDestructive()
    {
        const string migration = """
            protected override void Up(MigrationBuilder migrationBuilder)
            {
                migrationBuilder.DropColumn(
                    name: "LegacyRef",
                    table: "Invoices");
                migrationBuilder.RenameColumn(name: "Total", table: "Invoices", newName: "Amount");
            }

            protected override void Down(MigrationBuilder migrationBuilder)
            {
                migrationBuilder.DropTable(name: "Invoices");
            }
            """;

        MigrationAnalysis analysis = MigrationInspector.Inspect("Migrations/20261021_DropLegacy.cs", migration);

        analysis.Risk.Should().Be(MigrationRisk.Destructive);
        analysis.Operations.Should().BeEquivalentTo(new[]
        {
            new MigrationOperation(MigrationOperationKind.DropColumn, "Invoices.LegacyRef"),
            new MigrationOperation(MigrationOperationKind.RenameColumn, "Invoices.Total")
        });
    }

    [Fact]
    public void MigrationInspector_AdditiveMigration_IsSafe()
    {
        MigrationInspector.Inspect("Migrations/20261018_AddExportJobs.cs",
                "migrationBuilder.CreateTable(name: \"ExportJobs\", columns: table => new { });")
            .Risk.Should().Be(MigrationRisk.Safe);
    }

    [Fact]
    public void MigrationInspector_SqlTruncate_IsDestructive()
    {
        MigrationAnalysis analysis = MigrationInspector.Inspect("migrations/V3__reset.sql", "TRUNCATE TABLE audit_log;");

        analysis.Risk.Should().Be(MigrationRisk.Destructive);
        analysis.Operations.Should().ContainSingle()
            .Which.Should().Be(new MigrationOperation(MigrationOperationKind.Truncate, "audit_log"));
    }

    private static Dependency Package(string name, string version) =>
        new() { Name = name, CurrentVersion = version, Ecosystem = DependencyEcosystem.Npm };

    [Fact]
    public void DependencyChanges_ClassifiesAddedRemovedAndMajorUpgrades()
    {
        List<DependencyChange> changes = DependencyChanges.Compare(
            [Package("axios", "1.7.2"), Package("moment", "2.30.1"), Package("react", "18.3.1")],
            [Package("axios", "1.8.4"), Package("dayjs", "1.11.0"), Package("react", "19.0.0")]);

        changes.Select(change => (change.Current.Name, change.Kind, change.IsMajor)).Should().BeEquivalentTo(new[]
        {
            ("axios", DependencyChangeKind.Upgraded, false),
            ("dayjs", DependencyChangeKind.Added, false),
            ("moment", DependencyChangeKind.Removed, false),
            ("react", DependencyChangeKind.Upgraded, true)
        });
    }

    [Fact]
    public void DependencyChanges_SameVersion_IsNotAChange()
    {
        DependencyChanges.Compare([Package("Axios", "1.7.2")], [Package("axios", "v1.7.2")]).Should().BeEmpty();
    }

    [Theory]
    [InlineData("✨ Annuler un scan de projet", ReleaseCommitCategory.Feature, "Annuler un scan de projet")]
    [InlineData(":bug: corriger l'export", ReleaseCommitCategory.Fix, "Corriger l'export")]
    [InlineData("feat(export): add pdf export", ReleaseCommitCategory.Feature, "Add pdf export")]
    [InlineData("fix!: crash on login", ReleaseCommitCategory.Fix, "Crash on login")]
    [InlineData("💄 Harmoniser les lignes", ReleaseCommitCategory.Maintenance, "Harmoniser les lignes")]
    public void ReleaseNotes_CategorisesAndCleansTitles(string title, ReleaseCommitCategory category, string note)
    {
        ReleaseNotes.CategoryOf(title).Should().Be(category);
        ReleaseNotes.NoteTitleOf(title).Should().Be(note);
    }

    [Fact]
    public void ReleaseNotes_KeepsOnlyTheFirstLineAndSpotsMerges()
    {
        ReleaseNotes.TitleOf("Fix export\n\nLong body").Should().Be("Fix export");
        ReleaseNotes.IsMergeCommit("Merge branch 'develop' into main").Should().BeTrue();
    }

    [Fact]
    public async Task Validator_IdenticalReferences_AreRejected()
    {
        Result result = await new ReleaseComparisonValidator()
            .ValidateAsync(new ReleaseComparisonModel { Base = "v1.0.0", Head = " v1.0.0 " }, CancellationToken.None);

        result.ValidationErrors.Should().ContainSingle()
            .Which.Code.Should().Be(ValidationCodes.DeploymentReferencesIdentical);
    }

    [Fact]
    public async Task Validator_MissingReference_IsRejected()
    {
        Result result = await new ReleaseComparisonValidator()
            .ValidateAsync(new ReleaseComparisonModel { Base = "v1.0.0" }, CancellationToken.None);

        result.ValidationErrors.Should().ContainSingle()
            .Which.Code.Should().Be(ValidationCodes.DeploymentReferenceRequired);
    }

    private sealed class CompareHandler(string body) : HttpMessageHandler
    {
        public string? RequestedPath { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            RequestedPath = request.RequestUri!.AbsolutePath;

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(body, Encoding.UTF8, "application/json")
            });
        }
    }

    private sealed class StubHttpClientFactory(HttpMessageHandler handler) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => new(handler, disposeHandler: false);
    }

    [Fact]
    public async Task GitHubCompare_ReadsCommitsAndChangedFiles()
    {
        CompareHandler handler = new("""
            {
              "html_url": "https://github.com/acme/app/compare/v1...release/2",
              "total_commits": 1,
              "commits": [
                { "sha": "abc", "html_url": "https://github.com/acme/app/commit/abc",
                  "commit": { "message": "✨ Export PDF\n\nbody", "author": { "name": "Camille", "date": "2026-10-10T08:00:00Z" } } }
              ],
              "files": [
                { "filename": "src/Billing/Invoice.cs", "status": "modified", "additions": 12, "deletions": 4 },
                { "filename": "src/Billing/Export.cs", "status": "added" }
              ]
            }
            """);
        RepositoryHostClient client = new(new StubHttpClientFactory(handler),
            Options.Create(new RepositoryHostSettings()), new MemoryCache(new MemoryCacheOptions()),
            NullLogger<RepositoryHostClient>.Instance);

        RepositoryComparison? comparison = await client.CompareAsync("github.com", "acme", "app",
            new RepositoryAccess("token", GitLabInstance.Public), "v1", "release/2", CancellationToken.None);

        handler.RequestedPath.Should().Be("/repos/acme/app/compare/v1...release/2");
        comparison!.Commits.Should().ContainSingle()
            .Which.Should().Be(new RepositoryCommit("✨ Export PDF\n\nbody",
                new DateTime(2026, 10, 10, 8, 0, 0, DateTimeKind.Utc)));
        comparison.Files.Should().BeEquivalentTo(new[]
        {
            new RepositoryChangedFile("src/Billing/Invoice.cs", RepositoryFileChange.Modified),
            new RepositoryChangedFile("src/Billing/Export.cs", RepositoryFileChange.Added)
        });
        comparison.Truncated.Should().BeFalse();
    }
}
