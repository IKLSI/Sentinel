using Sentinel.Domain.Models;
using Sentinel.Infrastructure.Data;
using Sentinel.Infrastructure.Repositories;

namespace Sentinel.Tests.Helpers;

public sealed class PostgresScope : IAsyncDisposable
{
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

    public Ticket NewTicket(string title, Guid? organizationId = null, Guid? createdById = null) => new()
    {
        Id = Guid.NewGuid(),
        OrganizationId = organizationId ?? OrganizationId,
        Title = title,
        Description = "Description du ticket",
        Priority = TicketPriority.Medium,
        Type = TicketType.Bug,
        CreatedById = createdById ?? UserId,
        Tags = "[]",
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    public async ValueTask DisposeAsync() => await Context.DisposeAsync();
}
