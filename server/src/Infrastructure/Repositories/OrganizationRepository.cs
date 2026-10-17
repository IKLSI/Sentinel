using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class OrganizationRepository : CrudEntityWithIdRepository<Organization>, IOrganizationRepository
{
    public OrganizationRepository(SentinelContext context) : base(context) { }

    public Task<bool> ExistsBySlugAsync(string slug, CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking).AnyAsync(o => o.Slug == slug, cancellationToken);

    public Task LockForUpdateAsync(Guid organizationId, CancellationToken cancellationToken) =>
        Context.Database.ExecuteSqlAsync(
            $"""SELECT 1 FROM "Organizations" WHERE "Id" = {organizationId} FOR UPDATE""",
            cancellationToken);

    public async Task<int> AllocateTicketNumbersAsync(Guid organizationId, int count,
        CancellationToken cancellationToken)
    {
        List<int> lastNumbers = await Context.Database.SqlQuery<int>(
                $"""
                 UPDATE "Organizations"
                 SET "TicketCounter" = "TicketCounter" + {count}
                 WHERE "Id" = {organizationId}
                 RETURNING "TicketCounter" AS "Value"
                 """)
            .ToListAsync(cancellationToken);

        return lastNumbers.Single() - count + 1;
    }
}
