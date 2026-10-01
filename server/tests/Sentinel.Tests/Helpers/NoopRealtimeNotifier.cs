using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Realtime;

namespace Sentinel.Tests.Helpers;

public sealed class NoopRealtimeNotifier : IRealtimeNotifier
{
    public Task NotifyOrganizationAsync(Guid organizationId, RealtimeEvent notification,
        CancellationToken cancellationToken) => Task.CompletedTask;

    public Task NotifyAllAsync(RealtimeEvent notification, CancellationToken cancellationToken) =>
        Task.CompletedTask;
}
