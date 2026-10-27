using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Sentinel.Application.RuntimeLifecycles;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Tests.Services;

public class RuntimeLifecyclesGetServiceTests
{
    private static readonly DateTime Today = DateTime.UtcNow.Date;

    private static FakeLifecycleClient DefaultClient() => new(new Dictionary<string, RuntimeLifecycle>
    {
        [".NET 8"] = new(null, Today.AddDays(20), Today.AddYears(-3)),
        [".NET 9"] = new(null, Today.AddDays(20), Today.AddYears(-2)),
        [".NET 10"] = new(null, Today.AddDays(700), Today.AddDays(-30)),
        ["Node.js 20"] = new(null, Today.AddDays(-170)),
        ["Node.js 24"] = new(false, null),
        ["PHP 8.2"] = new(true, null),
    });

    private static RuntimeLifecyclesGetService NewService(IRuntimeLifecycleClient client) =>
        new(client, new MemoryCache(new MemoryCacheOptions()));

    private static async Task<RuntimeLifecyclesDto> ExecuteAsync(IRuntimeLifecycleClient client) =>
        (await NewService(client).ExecuteAsync(CancellationToken.None)).Value!;

    private static RuntimeLifecycleItemDto Item(RuntimeLifecyclesDto dto, string name) =>
        dto.Items.Single(item => item.Name == name);

    [Fact]
    public async Task ExecuteAsync_ReturnsEveryShowcaseRuntimeInOrder()
    {
        RuntimeLifecyclesDto dto = await ExecuteAsync(DefaultClient());

        dto.Items.Select(item => item.Name).Should().Equal(
            ".NET 8", ".NET 9", ".NET 10", "Node.js 20", "Node.js 24", "Python 3.10", "PHP 8.2", "Ruby 3.3");
        dto.WarningWindowDays.Should().Be(FindingRules.ApproachingEolWindowDays);
    }

    [Fact]
    public async Task ExecuteAsync_MapsTheDomainStatuses()
    {
        RuntimeLifecyclesDto dto = await ExecuteAsync(DefaultClient());

        Item(dto, ".NET 8").Status.Should().Be(RuntimeLifecycleStatuses.Approaching);
        Item(dto, ".NET 10").Status.Should().Be(RuntimeLifecycleStatuses.Supported);
        Item(dto, "Node.js 20").Status.Should().Be(RuntimeLifecycleStatuses.Ended);
        Item(dto, "Node.js 24").Status.Should().Be(RuntimeLifecycleStatuses.Supported);
        Item(dto, "PHP 8.2").Status.Should().Be(RuntimeLifecycleStatuses.Ended);
        Item(dto, "Python 3.10").Status.Should().Be(RuntimeLifecycleStatuses.Unknown);
    }

    [Fact]
    public async Task ExecuteAsync_ComputesDaysRemainingAndKeepsTheDates()
    {
        RuntimeLifecyclesDto dto = await ExecuteAsync(DefaultClient());

        Item(dto, ".NET 8").DaysRemaining.Should().BeInRange(19, 20);
        Item(dto, ".NET 8").ReleaseDate.Should().Be(Today.AddYears(-3));
        Item(dto, "Node.js 20").DaysRemaining.Should().BeNegative();
        Item(dto, "Node.js 24").DaysRemaining.Should().BeNull();
        Item(dto, "Python 3.10").Should().BeEquivalentTo(new
        {
            ReleaseDate = (DateTime?)null,
            EndOfLifeDate = (DateTime?)null,
            DaysRemaining = (int?)null
        });
    }

    [Fact]
    public async Task ExecuteAsync_GroupsTheRuntimesSharingTheNearestEndOfLife()
    {
        RuntimeLifecyclesDto dto = await ExecuteAsync(DefaultClient());

        dto.UpcomingNames.Should().Equal(".NET 8", ".NET 9");
        dto.UpcomingDays.Should().Be(Item(dto, ".NET 8").DaysRemaining);
    }

    [Fact]
    public async Task ExecuteAsync_WhenTheFeedIsDown_ReturnsUnknownItems()
    {
        RuntimeLifecyclesDto dto = await ExecuteAsync(new FakeLifecycleClient(new Dictionary<string, RuntimeLifecycle>()));

        dto.Items.Should().HaveCount(RuntimeLifecycleShowcase.Entries.Count)
            .And.OnlyContain(item => item.Status == RuntimeLifecycleStatuses.Unknown);
        dto.UpcomingNames.Should().BeEmpty();
        dto.UpcomingDays.Should().BeNull();
    }

    [Fact]
    public async Task ExecuteAsync_CachesTheWholeResponse()
    {
        FakeLifecycleClient client = DefaultClient();
        RuntimeLifecyclesGetService service = NewService(client);

        await service.ExecuteAsync(CancellationToken.None);
        await service.ExecuteAsync(CancellationToken.None);

        client.Calls.Should().Be(RuntimeLifecycleShowcase.Entries.Count);
    }

    private sealed class FakeLifecycleClient(IReadOnlyDictionary<string, RuntimeLifecycle> lifecycles)
        : IRuntimeLifecycleClient
    {
        private int _calls;

        public int Calls => _calls;

        public Task<RuntimeLifecycle?> GetLifecycleAsync(string runtimeName, string version,
            CancellationToken cancellationToken)
        {
            Interlocked.Increment(ref _calls);

            return Task.FromResult(lifecycles.GetValueOrDefault($"{runtimeName} {version}"));
        }
    }
}
