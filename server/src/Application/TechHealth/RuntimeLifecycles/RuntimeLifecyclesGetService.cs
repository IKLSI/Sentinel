using Microsoft.Extensions.Caching.Memory;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.TechHealth.RuntimeLifecycles;

public class RuntimeLifecyclesGetService(IRuntimeLifecycleClient runtimeLifecycleClient, IMemoryCache cache)
    : IService
{
    public async Task<Result<RuntimeLifecyclesDto>> ExecuteAsync(CancellationToken cancellationToken)
    {
        if (cache.TryGetValue(CacheKeys.PublicRuntimeLifecycles, out RuntimeLifecyclesDto? cached) && cached != null)
            return cached;

        DateTime now = DateTime.UtcNow;

        RuntimeLifecycle?[] lifecycles = await Task.WhenAll(RuntimeLifecycleShowcase.Entries.Select(entry =>
            runtimeLifecycleClient.GetLifecycleAsync(entry.RuntimeName, entry.Version, cancellationToken)));

        List<RuntimeLifecycleItemDto> items = RuntimeLifecycleShowcase.Entries
            .Zip(lifecycles, (entry, lifecycle) => ToItem(entry, lifecycle, now))
            .ToList();

        List<RuntimeLifecycleItemDto> upcoming = UpcomingItems(items, now);

        RuntimeLifecyclesDto dto = new()
        {
            AsOf = now,
            WarningWindowDays = FindingRules.ApproachingEolWindowDays,
            Items = items,
            UpcomingNames = upcoming.Select(item => item.Name).ToList(),
            UpcomingDays = upcoming.FirstOrDefault()?.DaysRemaining,
        };

        cache.Set(CacheKeys.PublicRuntimeLifecycles, dto, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = CacheKeys.PublicRuntimeLifecyclesTtl,
            Size = 1
        });

        return dto;
    }

    private static RuntimeLifecycleItemDto ToItem(RuntimeShowcaseEntry entry, RuntimeLifecycle? lifecycle,
        DateTime now)
    {
        if (lifecycle == null) return new RuntimeLifecycleItemDto { Name = entry.DisplayName };

        Runtime runtime = new()
        {
            Name = entry.RuntimeName,
            Version = entry.Version,
            EolDate = lifecycle.EndOfLifeDate,
            IsEol = lifecycle.IsEolAt(now)
        };

        return new RuntimeLifecycleItemDto
        {
            Name = entry.DisplayName,
            ReleaseDate = lifecycle.ReleaseDate,
            EndOfLifeDate = lifecycle.EndOfLifeDate,
            Status = StatusOf(runtime, now),
            DaysRemaining = RuntimeEolAssessment.Of(runtime, now).DaysRemaining,
        };
    }

    private static string StatusOf(Runtime runtime, DateTime now)
    {
        if (FindingRules.IsEffectivelyEol(runtime)) return RuntimeLifecycleStatuses.Ended;
        if (FindingRules.IsApproachingEol(runtime, now)) return RuntimeLifecycleStatuses.Approaching;

        return runtime.IsEol == false ? RuntimeLifecycleStatuses.Supported : RuntimeLifecycleStatuses.Unknown;
    }

    private static List<RuntimeLifecycleItemDto> UpcomingItems(List<RuntimeLifecycleItemDto> items, DateTime now)
    {
        List<RuntimeLifecycleItemDto> future = items
            .Where(item => item.EndOfLifeDate > now)
            .ToList();

        if (future.Count == 0) return [];

        DateTime nearestDate = future.Min(item => item.EndOfLifeDate!.Value.Date);

        return future.Where(item => item.EndOfLifeDate!.Value.Date == nearestDate).ToList();
    }
}
