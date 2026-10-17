using Sentinel.Domain.Realtime;

namespace Sentinel.Domain.Abstractions;

public interface IRealtimeNotifier
{
    Task NotifyOrganizationAsync(Guid organizationId, RealtimeEvent notification);

    Task NotifyAllAsync(RealtimeEvent notification);
}
