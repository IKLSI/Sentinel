using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Repositories;

public interface ITicketHistoryRepository : ICrudEntityWithIdRepository<TicketHistory>
{
}
