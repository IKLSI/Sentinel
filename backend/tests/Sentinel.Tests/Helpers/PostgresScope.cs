using Sentinel.Domain.Entities;
using Sentinel.Infrastructure.Data;
using Sentinel.Infrastructure.Repositories;

namespace Sentinel.Tests.Helpers;

public sealed class PostgresScope : IAsyncDisposable
{
    private int _nextTicketNumber = 1;

    public PostgresScope(PostgresFixture fixture, Guid? organizationId = null, Guid? userId = null)
    {
        OrganizationId = organizationId ?? Guid.NewGuid();
        UserId = userId ?? Guid.NewGuid();

        Tenant = new FakeTenantContext { OrganizationId = OrganizationId, UserId = UserId };
        SystemScope = new SystemScope();
        Context = fixture.CreateContext(Tenant, SystemScope);
        CommitScopeFactory = new CommitScopeFactory(Context);

        Tickets = new TicketRepository(Context);
        TicketComments = new TicketCommentRepository(Context);
        Projects = new ProjectRepository(Context);
        Users = new UserRepository(Context);
        Organizations = new OrganizationRepository(Context);
    }

    public Guid OrganizationId { get; }
    public Guid UserId { get; }

    public SentinelContext Context { get; }
    public FakeTenantContext Tenant { get; }
    public SystemScope SystemScope { get; }
    public CommitScopeFactory CommitScopeFactory { get; }

    public TicketRepository Tickets { get; }
    public TicketCommentRepository TicketComments { get; }
    public ProjectRepository Projects { get; }
    public UserRepository Users { get; }
    public OrganizationRepository Organizations { get; }

    public async Task SeedAsync(params object[] entities)
    {
        Context.AddRange(entities);
        await Context.SaveChangesAsync();
        Context.ChangeTracker.Clear();
    }

    public async Task SeedAsSystemAsync(params object[] entities)
    {
        using IDisposable elevation = SystemScope.Enter();

        await SeedAsync(entities);
    }

    public Organization NewOrganization(Guid? id = null, PlanTier tier = PlanTier.Free) => new()
    {
        Id = id ?? OrganizationId,
        Name = "Organisation de test",
        Slug = $"org-{Guid.NewGuid():N}",
        PlanTier = tier,
        SubscriptionStatus = SubscriptionStatus.Active
    };

    public User NewUser(Guid? id = null, Guid? organizationId = null) => new()
    {
        Id = id ?? UserId,
        OrganizationId = organizationId ?? OrganizationId,
        Email = $"utilisateur-{Guid.NewGuid():N}@test.fr",
        FirstName = "Auteur",
        LastName = "Test",
        PasswordHash = "hash",
        Role = UserRole.Developer,
        IsActive = true
    };

    public Ticket NewTicket(string title, Guid? organizationId = null, Guid? createdById = null,
        int? number = null) => new()
    {
        Id = Guid.NewGuid(),
        OrganizationId = organizationId ?? OrganizationId,
        Number = number ?? _nextTicketNumber++,
        Title = title,
        Description = "Description du ticket",
        Priority = TicketPriority.Medium,
        Type = TicketType.Bug,
        CreatedById = createdById ?? UserId,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    public Project NewProject(Guid? id = null, Guid? organizationId = null) => new()
    {
        Id = id ?? Guid.NewGuid(),
        OrganizationId = organizationId ?? OrganizationId,
        Name = "Projet de test"
    };

    public Dependency NewDependency(Guid projectId) => new()
    {
        Id = Guid.NewGuid(),
        ProjectId = projectId,
        Name = "paquet-test",
        CurrentVersion = "1.0.0"
    };

    public Vulnerability NewVulnerability(Guid dependencyId) => new()
    {
        Id = Guid.NewGuid(),
        DependencyId = dependencyId,
        CveId = "CVE-2026-0001",
        Description = "Faille de test",
        PackageName = "paquet-test"
    };

    public async ValueTask DisposeAsync() => await Context.DisposeAsync();
}
