using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Realtime;

namespace Sentinel.Tests.Helpers;

public sealed class NoopRealtimeNotifier : IRealtimeNotifier
{
    public Task NotifyOrganizationAsync(Guid organizationId, RealtimeEvent notification) =>
        Task.CompletedTask;

    public Task NotifyAllAsync(RealtimeEvent notification) => Task.CompletedTask;
}
