using Sentinel.Domain.Entities;
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
        Projects = new ProjectRepository(Context);
        Users = new UserRepository(Context);
        Organizations = new OrganizationRepository(Context);
        Invitations = new UserInvitationRepository(Context);
        AuditLogs = new AuditLogRepository(Context);
    }

    public Guid OrganizationId { get; }
    public Guid UserId { get; }

    public SentinelContext Context { get; }
    public FakeTenantContext Tenant { get; }
    public CommitScopeFactory CommitScopeFactory { get; }

    public TicketRepository Tickets { get; }
    public ProjectRepository Projects { get; }
    public UserRepository Users { get; }
    public OrganizationRepository Organizations { get; }
    public UserInvitationRepository Invitations { get; }
    public AuditLogRepository AuditLogs { get; }

    public async Task SeedAsync(params object[] entities)
    {
        Context.AddRange(entities);
        await Context.SaveChangesAsync();
        Context.ChangeTracker.Clear();
    }

    public Organization NewOrganization(Guid? id = null) => new()
    {
        Id = id ?? OrganizationId,
        Name = "Organisation de test",
        Slug = $"org-{Guid.NewGuid():N}"
    };

    public void Dispose() => Context.Dispose();
}
