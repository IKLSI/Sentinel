using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.DTOs.Tickets;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class TicketStatusRepository : CrudEntityWithIdRepository<TicketStatus>, ITicketStatusRepository
{
    public TicketStatusRepository(SentinelContext context) : base(context) { }

    public async Task<IReadOnlyList<TicketStatusDto>> ListForOrganizationAsync(Guid organizationId,
        CancellationToken cancellationToken) =>
        await Query(QueryTracking.NoTracking)
            .Where(s => s.OrganizationId == organizationId)
            .OrderBy(s => s.Order)
            .Select(s => new TicketStatusDto
            {
                Id = s.Id,
                Name = s.Name,
                Color = s.Color,
                Order = s.Order,
                IsDefault = s.IsDefault,
                IsClosed = s.IsClosed,
                TicketCount = s.Tickets.Count(),
            })
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<TicketStatus>> ListByOrganizationOrderedAsync(Guid organizationId,
        CancellationToken cancellationToken) =>
        await Query(QueryTracking.NoTracking)
            .Where(s => s.OrganizationId == organizationId)
            .OrderBy(s => s.Order)
            .ToListAsync(cancellationToken);

    public Task<TicketStatus?> GetOrDefaultFirstByOrderAsync(Guid organizationId,
        CancellationToken cancellationToken) =>
        Query(QueryTracking.Tracked)
            .Where(s => s.OrganizationId == organizationId)
            .OrderBy(s => s.Order)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<bool> ExistsForOrganizationAsync(Guid organizationId, CancellationToken cancellationToken) =>
        Query(QueryTracking.NoTracking).AnyAsync(s => s.OrganizationId == organizationId, cancellationToken);
}
