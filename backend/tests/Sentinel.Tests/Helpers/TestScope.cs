using Sentinel.Domain.Models;
using Sentinel.Infrastructure.Data;
using Sentinel.Infrastructure.Repositories;

namespace Sentinel.Tests.Helpers;

public sealed class TestScope : IDisposable
{
    public TestScope(Guid? organizationId = null, Guid? userId = null)
    {
        OrganizationId = organizationId ?? Guid.NewGuid();
        UserId = userId ?? Guid.NewGuid();

        Tenant = new FakeTenantContext { OrganizationId = OrganizationId, UserId = UserId };
        Context = TestDbContextFactory.CreateInMemory(Tenant);
        CommitScopeFactory = new CommitScopeFactory(Context);

        Tickets = new TicketRepository(Context);
        TicketStatuses = new TicketStatusRepository(Context);
        Projects = new ProjectRepository(Context);
        Users = new UserRepository(Context);
        Organizations = new OrganizationRepository(Context);
        Invitations = new UserInvitationRepository(Context);
    }

    public Guid OrganizationId { get; }
    public Guid UserId { get; }

    public SentinelContext Context { get; }
    public FakeTenantContext Tenant { get; }
    public CommitScopeFactory CommitScopeFactory { get; }

    public TicketRepository Tickets { get; }
    public TicketStatusRepository TicketStatuses { get; }
    public ProjectRepository Projects { get; }
    public UserRepository Users { get; }
    public OrganizationRepository Organizations { get; }
    public UserInvitationRepository Invitations { get; }

    public async Task SeedAsync(params object[] entities)
    {
        Context.AddRange(entities);
        await Context.SaveChangesAsync();
        Context.ChangeTracker.Clear();
    }

    public Organization NewOrganization(PlanTier tier = PlanTier.Free, Guid? id = null) => new()
    {
        Id = id ?? OrganizationId,
        Name = "Organisation de test",
        Slug = $"org-{Guid.NewGuid():N}",
        PlanTier = tier,
        SubscriptionStatus = SubscriptionStatus.Active
    };

    public void Dispose() => Context.Dispose();
}
