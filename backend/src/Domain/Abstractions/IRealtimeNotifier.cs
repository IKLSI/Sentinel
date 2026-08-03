using Sentinel.Domain.Realtime;

namespace Sentinel.Domain.Abstractions;

public interface IRealtimeNotifier
{
    Task NotifyOrganizationAsync(Guid organizationId, RealtimeEvent notification,
        CancellationToken cancellationToken);

    Task NotifyAllAsync(RealtimeEvent notification, CancellationToken cancellationToken);
}
