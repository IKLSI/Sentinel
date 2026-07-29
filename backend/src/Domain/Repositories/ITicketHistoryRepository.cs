using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;

namespace Sentinel.Domain.Repositories;

public interface ITicketHistoryRepository : ICrudEntityWithIdRepository<TicketHistory>
{
}
