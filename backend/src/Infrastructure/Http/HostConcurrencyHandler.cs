namespace Sentinel.Infrastructure.Http;

public sealed class HostConcurrencyHandler(HostConcurrencyLimiter limiter) : DelegatingHandler
{
    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        string? host = request.RequestUri?.Host;

        if (string.IsNullOrEmpty(host)) return await base.SendAsync(request, cancellationToken);

        SemaphoreSlim gate = limiter.GateFor(host);

        await gate.WaitAsync(cancellationToken);

        try
        {
            return await base.SendAsync(request, cancellationToken);
        }
        finally
        {
            gate.Release();
        }
    }
}
