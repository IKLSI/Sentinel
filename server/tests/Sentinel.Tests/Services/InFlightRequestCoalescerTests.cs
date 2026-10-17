using FluentAssertions;
using Sentinel.Infrastructure.Http;

namespace Sentinel.Tests.Services;

public class InFlightRequestCoalescerTests
{
    [Fact]
    public async Task RunAsync_ConcurrentCallsOnSameKey_ShareASingleFetch()
    {
        InFlightRequestCoalescer sut = new InFlightRequestCoalescer();
        TaskCompletionSource<string> gate = new TaskCompletionSource<string>();
        int calls = 0;

        Func<Task<string>> fetch = () =>
        {
            Interlocked.Increment(ref calls);
            return gate.Task;
        };

        Task<string> first = sut.RunAsync("key", fetch);
        Task<string> second = sut.RunAsync("key", fetch);

        gate.SetResult("value");

        (await Task.WhenAll(first, second)).Should().AllBe("value");
        calls.Should().Be(1);
    }

    [Fact]
    public async Task RunAsync_AfterCompletion_FetchesAgain()
    {
        InFlightRequestCoalescer sut = new InFlightRequestCoalescer();
        int calls = 0;

        await sut.RunAsync("key", () => Task.FromResult(Interlocked.Increment(ref calls)));
        int second = await sut.RunAsync("key", () => Task.FromResult(Interlocked.Increment(ref calls)));

        second.Should().Be(2);
    }

    [Fact]
    public async Task RunAsync_DifferentKeys_AreNotShared()
    {
        InFlightRequestCoalescer sut = new InFlightRequestCoalescer();

        string first = await sut.RunAsync("a", () => Task.FromResult("A"));
        string second = await sut.RunAsync("b", () => Task.FromResult("B"));

        (first, second).Should().Be(("A", "B"));
    }
}
