using System.Text.Json.Nodes;
using FluentAssertions;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Logging.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Security;
using Sentinel.Application.TechHealth.Remediation.GetRemediationConfig;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.TechHealth;
using Sentinel.Infrastructure.Repositories;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Services;

public class RemediationConfigServiceTests
{
    private const string Ticket = "ticket-value";

    [Fact]
    public async Task ExecuteAsync_ValidTicket_ReturnsConfigAndConsumesTicket()
    {
        using TestScope scope = new TestScope();
        TokenProtector tokenProtector = NewTokenProtector();
        VulnerabilityRemediation remediation =
            await SeedAsync(scope, tokenProtector, DateTime.UtcNow.AddMinutes(10));
        RemediationConfigService sut = NewService(scope, tokenProtector);

        Result<JsonObject> first = await sut.ExecuteAsync(remediation.Id, Ticket, CancellationToken.None);
        Result<JsonObject> second = await sut.ExecuteAsync(remediation.Id, Ticket, CancellationToken.None);

        first.IsSuccess.Should().BeTrue();
        first.Value!["token"]!.GetValue<string>().Should().Be("glpat-secret");
        second.Code.Should().Be(ErrorCodes.RemediationTicketInvalid);
    }

    [Fact]
    public async Task ExecuteAsync_ValidTicket_TargetsEveryRemediableDependencyExceptSuppressedOnes()
    {
        using TestScope scope = new TestScope();
        TokenProtector tokenProtector = NewTokenProtector();
        VulnerabilityRemediation remediation =
            await SeedAsync(scope, tokenProtector, DateTime.UtcNow.AddMinutes(10));

        Result<JsonObject> result = await NewService(scope, tokenProtector)
            .ExecuteAsync(remediation.Id, Ticket, CancellationToken.None);

        result.Value!["packageRules"]!.AsArray().Skip(1)
            .Select(rule => rule!["matchPackageNames"]![0]!.GetValue<string>())
            .Should().Equal("axios", "lodash");
    }

    [Fact]
    public async Task ExecuteAsync_NothingLeftToFix_ReturnsNotEligible()
    {
        using TestScope scope = new TestScope();
        TokenProtector tokenProtector = NewTokenProtector();
        VulnerabilityRemediation remediation =
            await SeedAsync(scope, tokenProtector, DateTime.UtcNow.AddMinutes(10), withVulnerabilities: false);

        Result<JsonObject> result = await NewService(scope, tokenProtector)
            .ExecuteAsync(remediation.Id, Ticket, CancellationToken.None);

        result.Code.Should().Be(ErrorCodes.RemediationNotEligible);
    }

    [Fact]
    public async Task ExecuteAsync_ExpiredTicket_ReturnsTicketInvalid()
    {
        using TestScope scope = new TestScope();
        TokenProtector tokenProtector = NewTokenProtector();
        VulnerabilityRemediation remediation =
            await SeedAsync(scope, tokenProtector, DateTime.UtcNow.AddMinutes(-1));

        Result<JsonObject> result = await NewService(scope, tokenProtector)
            .ExecuteAsync(remediation.Id, Ticket, CancellationToken.None);

        result.Code.Should().Be(ErrorCodes.RemediationTicketInvalid);
    }

    [Fact]
    public async Task ExecuteAsync_WrongTicket_ReturnsTicketInvalid()
    {
        using TestScope scope = new TestScope();
        TokenProtector tokenProtector = NewTokenProtector();
        VulnerabilityRemediation remediation =
            await SeedAsync(scope, tokenProtector, DateTime.UtcNow.AddMinutes(10));

        Result<JsonObject> result = await NewService(scope, tokenProtector)
            .ExecuteAsync(remediation.Id, "other-ticket", CancellationToken.None);

        result.Code.Should().Be(ErrorCodes.RemediationTicketInvalid);
    }

    private static async Task<VulnerabilityRemediation> SeedAsync(TestScope scope, TokenProtector tokenProtector,
        DateTime ticketExpiresAt, bool withVulnerabilities = true)
    {
        Organization organization = scope.NewOrganization();
        organization.GitlabToken = tokenProtector.Protect("glpat-secret");
        organization.GitlabBaseUrl = "https://git.example.com";

        Project project = new Project
        {
            OrganizationId = scope.OrganizationId,
            Name = "app",
            RepositoryType = RepositoryType.GitLab,
            RepositoryUrl = "https://git.example.com/group/app"
        };

        if (withVulnerabilities)
        {
            project.Dependencies.Add(VulnerableDependency(scope, "lodash", "4.17.15", "CVE-1", "4.17.21"));
            project.Dependencies.Add(VulnerableDependency(scope, "axios", "1.6.0", "CVE-2", "1.7.4"));
            project.Dependencies.Add(VulnerableDependency(scope, "express", "4.18.0", "CVE-3", "4.19.2"));
        }

        VulnerabilityRemediation remediation = new VulnerabilityRemediation
        {
            OrganizationId = scope.OrganizationId,
            ProjectId = project.Id,
            BranchName = "sentinel/fix-vulnerabilities",
            Status = RemediationStatus.Running,
            ConfigTicketHash = SecureToken.Hash(Ticket),
            ConfigTicketExpiresAt = ticketExpiresAt
        };

        VulnerabilitySuppression suppression = new VulnerabilitySuppression
        {
            OrganizationId = scope.OrganizationId,
            ProjectId = project.Id,
            FindingKey = FindingKeys.ForVulnerability(DependencyEcosystem.Npm, "express", "CVE-3")
        };

        await scope.SeedAsync(organization, project, remediation, suppression);

        return remediation;
    }

    private static Dependency VulnerableDependency(TestScope scope, string name, string currentVersion,
        string cveId, string fixedVersion) => new()
    {
        OrganizationId = scope.OrganizationId,
        Name = name,
        CurrentVersion = currentVersion,
        Vulnerabilities =
        [
            new Vulnerability
            {
                OrganizationId = scope.OrganizationId,
                CveId = cveId,
                PackageName = name,
                FixedVersion = fixedVersion
            }
        ]
    };

    private static RemediationConfigService NewService(TestScope scope, TokenProtector tokenProtector) =>
        new(new VulnerabilityRemediationRepository(scope.Context), scope.Projects,
            new VulnerabilitySuppressionRepository(scope.Context), scope.Organizations, tokenProtector,
            scope.CommitScopeFactory, new FakeSystemScope());

    private static TokenProtector NewTokenProtector() =>
        new(new EphemeralDataProtectionProvider(), NullLogger<TokenProtector>.Instance);
}
