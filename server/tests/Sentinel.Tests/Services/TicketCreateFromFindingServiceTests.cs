using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Sentinel.Application.Common;
using Sentinel.Application.Dashboard;
using Sentinel.Application.Tickets;
using Sentinel.Application.Tickets.CreateFromFinding;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.TechHealth;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Services;

public class TicketCreateFromFindingServiceTests
{
    [Fact]
    public async Task ExecuteAsync_QuandUnTicketEstDejaOuvertPourLeFinding_LeRenvoie()
    {
        using TestScope scope = new TestScope();
        Project project = await SeedProjectAsync(scope);
        string findingKey = FindingKeys.ForVulnerability(DependencyEcosystem.Npm, "lodash", "GHSA-1");

        Ticket existing = NewTicket(scope, project.Id, FindingKind.Vulnerability, findingKey);
        await scope.SeedAsync(existing);

        Result<TicketDto> result = await BuildSut(scope).ExecuteAsync(new CreateTicketFromFindingRequest
        {
            ProjectId = project.Id,
            Kind = FindingKind.Vulnerability,
            FindingKey = findingKey.ToUpperInvariant()
        }, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value!.Id.Should().Be(existing.Id);
        scope.Context.Tickets.Count().Should().Be(1);
    }

    [Fact]
    public async Task ExecuteAsync_QuandLeFindingNExistePas_RenvoieNotFound()
    {
        using TestScope scope = new TestScope();
        Project project = await SeedProjectAsync(scope);

        Result<TicketDto> result = await BuildSut(scope).ExecuteAsync(new CreateTicketFromFindingRequest
        {
            ProjectId = project.Id,
            Kind = FindingKind.Vulnerability,
            FindingKey = FindingKeys.ForVulnerability(DependencyEcosystem.Npm, "lodash", "GHSA-INCONNU")
        }, CancellationToken.None);

        result.Status.Should().Be(ResultStatus.NotFound);
        result.Code.Should().Be(ErrorCodes.TicketFindingNotFound);
    }

    [Fact]
    public async Task ExecuteAsync_QuandLaDependanceEstAJour_RenvoieNotFound()
    {
        using TestScope scope = new TestScope();
        Project project = await SeedProjectAsync(scope);

        Result<TicketDto> result = await BuildSut(scope).ExecuteAsync(new CreateTicketFromFindingRequest
        {
            ProjectId = project.Id,
            Kind = FindingKind.OutdatedDependency,
            FindingKey = FindingKeys.ForDependency(DependencyEcosystem.Npm, "express")
        }, CancellationToken.None);

        result.Code.Should().Be(ErrorCodes.TicketFindingNotFound);
    }

    [Fact]
    public async Task ExecuteAsync_QuandLeProjetAppartientAUneAutreOrganisation_RenvoieNotFound()
    {
        using TestScope scope = new TestScope();
        Project project = await SeedProjectAsync(scope);
        scope.Tenant.OrganizationId = Guid.NewGuid();

        Result<TicketDto> result = await BuildSut(scope).ExecuteAsync(new CreateTicketFromFindingRequest
        {
            ProjectId = project.Id,
            Kind = FindingKind.Vulnerability,
            FindingKey = FindingKeys.ForVulnerability(DependencyEcosystem.Npm, "lodash", "GHSA-1")
        }, CancellationToken.None);

        result.Code.Should().Be(ErrorCodes.ProjectNotFound);
    }

    [Fact]
    public async Task ExecuteAsync_QuandLaCleEstVide_RenvoieInvalid()
    {
        using TestScope scope = new TestScope();

        Result<TicketDto> result = await BuildSut(scope).ExecuteAsync(new CreateTicketFromFindingRequest
        {
            ProjectId = Guid.NewGuid(),
            Kind = FindingKind.EolRuntime,
            FindingKey = " "
        }, CancellationToken.None);

        result.Status.Should().Be(ResultStatus.Invalid);
    }

    private static TicketCreateFromFindingService BuildSut(TestScope scope) => new(
        scope.Tickets,
        scope.Projects,
        scope.Users,
        scope.Organizations,
        scope.CommitScopeFactory,
        TestLocalizer.Create(),
        new DashboardCache(new MemoryCache(new MemoryCacheOptions())),
        new FakeAuditLogService(),
        new NoopRealtimeNotifier(),
        scope.Tenant,
        new TicketCreateFromFindingValidator());

    private static async Task<Project> SeedProjectAsync(TestScope scope)
    {
        Project project = new() { Id = Guid.NewGuid(), OrganizationId = scope.OrganizationId, Name = "Projet" };
        Dependency lodash = new()
        {
            Id = Guid.NewGuid(),
            ProjectId = project.Id,
            OrganizationId = project.OrganizationId,
            Name = "lodash",
            CurrentVersion = "4.17.15",
            LatestVersion = "4.17.21",
            Ecosystem = DependencyEcosystem.Npm
        };
        Dependency express = new()
        {
            Id = Guid.NewGuid(),
            ProjectId = project.Id,
            OrganizationId = project.OrganizationId,
            Name = "express",
            CurrentVersion = "5.0.0",
            LatestVersion = "5.0.0",
            Ecosystem = DependencyEcosystem.Npm
        };
        Vulnerability vulnerability = new()
        {
            Id = Guid.NewGuid(),
            DependencyId = lodash.Id,
            OrganizationId = project.OrganizationId,
            CveId = "GHSA-1",
            PackageName = "lodash",
            Description = "Faille"
        };

        await scope.SeedAsync(scope.NewOrganization(), NewUser(scope), project, lodash, express, vulnerability);

        return project;
    }

    private static User NewUser(TestScope scope) => new()
    {
        Id = scope.UserId,
        OrganizationId = scope.OrganizationId,
        Email = "membre@test.fr",
        FirstName = "Membre",
        LastName = "Test",
        PasswordHash = "hash",
        Role = UserRole.Developer,
        AccessStatus = UserAccessStatus.Active
    };

    private static Ticket NewTicket(TestScope scope, Guid projectId, FindingKind kind, string findingKey) => new()
    {
        Id = Guid.NewGuid(),
        OrganizationId = scope.OrganizationId,
        ProjectId = projectId,
        Number = 1,
        Title = "Ticket existant",
        CreatedById = scope.UserId,
        FindingKind = kind,
        FindingKey = findingKey
    };
}
