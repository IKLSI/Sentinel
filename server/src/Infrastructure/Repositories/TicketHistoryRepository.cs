using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class TicketHistoryRepository : CrudEntityWithIdRepository<TicketHistory>, ITicketHistoryRepository
{
    public TicketHistoryRepository(SentinelContext context) : base(context) { }
}
