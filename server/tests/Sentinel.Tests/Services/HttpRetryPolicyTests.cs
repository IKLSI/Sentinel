using System.Net;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Sentinel.Infrastructure.Http;

namespace Sentinel.Tests.Services;

public class HttpRetryPolicyTests
{
    private const string ClientName = "test";

    private sealed class SequenceHandler(params Func<HttpResponseMessage>[] responses) : HttpMessageHandler
    {
        public int Calls { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,
            CancellationToken cancellationToken) =>
            Task.FromResult(responses[Math.Min(Calls++, responses.Length - 1)]());
    }

    private static HttpClient Client(HttpMessageHandler inner)
    {
        ServiceCollection services = new ServiceCollection();

        services.AddHttpClient(ClientName)
            .ConfigurePrimaryHttpMessageHandler(() => inner)
            .AddResilienceHandler("retry", pipeline =>
                HttpRetryPolicy.Configure(pipeline, NullLogger.Instance));

        return services.BuildServiceProvider().GetRequiredService<IHttpClientFactory>().CreateClient(ClientName);
    }

    private static HttpResponseMessage RateLimited(DateTimeOffset reset)
    {
        HttpResponseMessage response = new(HttpStatusCode.Forbidden);
        response.Headers.Add("x-ratelimit-remaining", "0");
        response.Headers.Add("x-ratelimit-reset", reset.ToUnixTimeSeconds().ToString());
        return response;
    }

    [Fact]
    public async Task SendAsync_GitHubRateLimitResettingSoon_IsRetried()
    {
        SequenceHandler inner = new(
            () => RateLimited(DateTimeOffset.UtcNow),
            () => new HttpResponseMessage(HttpStatusCode.OK));

        HttpResponseMessage response = await Client(inner).GetAsync("https://api.github.com/repos/acme/app",
            TestContext.Current.CancellationToken);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        inner.Calls.Should().Be(2);
    }

    [Fact]
    public async Task SendAsync_GitHubRateLimitResettingLater_IsNotWaitedFor()
    {
        SequenceHandler inner = new(() => RateLimited(DateTimeOffset.UtcNow.AddMinutes(30)));

        HttpResponseMessage response = await Client(inner).GetAsync("https://api.github.com/repos/acme/app",
            TestContext.Current.CancellationToken);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        inner.Calls.Should().Be(1);
    }

    [Fact]
    public async Task SendAsync_PlainForbidden_IsNotRetried()
    {
        SequenceHandler inner = new(() => new HttpResponseMessage(HttpStatusCode.Forbidden));

        await Client(inner).GetAsync("https://api.github.com/repos/acme/private",
            TestContext.Current.CancellationToken);

        inner.Calls.Should().Be(1);
    }

    [Fact]
    public async Task SendAsync_TransientServerError_IsRetriedUntilSuccess()
    {
        SequenceHandler inner = new(
            () => new HttpResponseMessage(HttpStatusCode.ServiceUnavailable),
            () => new HttpResponseMessage(HttpStatusCode.OK));

        HttpResponseMessage response = await Client(inner).GetAsync("https://api.osv.dev/v1/vulns/GHSA-1",
            TestContext.Current.CancellationToken);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        inner.Calls.Should().Be(2);
    }
}
