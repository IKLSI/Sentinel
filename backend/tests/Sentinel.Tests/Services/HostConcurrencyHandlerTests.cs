using System.Net;
using FluentAssertions;
using Sentinel.Infrastructure.Http;

namespace Sentinel.Tests.Services;

public class HostConcurrencyHandlerTests
{
    private sealed class ConcurrencyProbe : HttpMessageHandler
    {
        private readonly TaskCompletionSource _release = new();
        private int _inFlight;

        public int PeakInFlight { get; private set; }

        public void Release() => _release.TrySetResult();

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            lock (this)
            {
                _inFlight++;
                if (_inFlight > PeakInFlight) PeakInFlight = _inFlight;
            }

            await _release.Task.WaitAsync(cancellationToken);

            lock (this) { _inFlight--; }

            return new HttpResponseMessage(HttpStatusCode.OK);
        }
    }

    private static HttpClient BuildClient(ConcurrencyProbe probe, HostConcurrencyLimiter limiter) =>
        new HttpClient(new HostConcurrencyHandler(limiter) { InnerHandler = probe });

    [Fact]
    public async Task SendAsync_CapsConcurrentRequestsPerHost()
    {
        ConcurrencyProbe probe = new ConcurrencyProbe();
        HttpClient client = BuildClient(probe, new HostConcurrencyLimiter());

        int requestCount = HostConcurrencyLimiter.MaxConcurrentRequestsPerHost + 10;

        Task<HttpResponseMessage>[] requests = Enumerable.Range(0, requestCount)
            .Select(_ => client.GetAsync("https://registry.npmjs.org/axios"))
            .ToArray();

        while (probe.PeakInFlight < HostConcurrencyLimiter.MaxConcurrentRequestsPerHost)
            await Task.Yield();

        probe.Release();
        await Task.WhenAll(requests);

        probe.PeakInFlight.Should().Be(HostConcurrencyLimiter.MaxConcurrentRequestsPerHost);
    }

    [Fact]
    public async Task SendAsync_DifferentHostsDoNotShareTheirBudget()
    {
        ConcurrencyProbe probe = new ConcurrencyProbe();
        HostConcurrencyLimiter limiter = new HostConcurrencyLimiter();
        HttpClient client = BuildClient(probe, limiter);

        int perHost = HostConcurrencyLimiter.MaxConcurrentRequestsPerHost;

        Task<HttpResponseMessage>[] requests = Enumerable.Range(0, perHost)
            .Select(_ => client.GetAsync("https://registry.npmjs.org/axios"))
            .Concat(Enumerable.Range(0, perHost)
                .Select(_ => client.GetAsync("https://pypi.org/pypi/requests/json")))
            .ToArray();

        while (probe.PeakInFlight < perHost * 2)
            await Task.Yield();

        probe.Release();
        await Task.WhenAll(requests);

        probe.PeakInFlight.Should().Be(perHost * 2);
    }

    [Fact]
    public async Task SendAsync_ReleasesTheSlotWhenTheInnerHandlerThrows()
    {
        HostConcurrencyLimiter limiter = new HostConcurrencyLimiter();
        SemaphoreSlim gate = limiter.GateFor("registry.npmjs.org");

        HttpClient client = new HttpClient(new HostConcurrencyHandler(limiter)
        {
            InnerHandler = new ThrowingHandler(),
        });

        for (int attempt = 0; attempt < HostConcurrencyLimiter.MaxConcurrentRequestsPerHost + 5; attempt++)
        {
            await client.Invoking(c => c.GetAsync("https://registry.npmjs.org/axios"))
                .Should().ThrowAsync<HttpRequestException>();
        }

        gate.CurrentCount.Should().Be(HostConcurrencyLimiter.MaxConcurrentRequestsPerHost);
    }

    private sealed class ThrowingHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,
            CancellationToken cancellationToken) =>
            throw new HttpRequestException("boom");
    }
}
