using Microsoft.Extensions.Logging;
using System.Net;

namespace Sentinel.Infrastructure.Http;

public sealed class ResilientHttpHandler : DelegatingHandler
{
    private readonly ILogger<ResilientHttpHandler> _logger;
    private const int MaxRetries = 3;
    private static readonly TimeSpan AttemptTimeout = TimeSpan.FromSeconds(15);
    private static readonly TimeSpan MaxRetryDelay = TimeSpan.FromSeconds(30);

    public ResilientHttpHandler(ILogger<ResilientHttpHandler> logger)
    {
        _logger = logger;
    }

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        byte[]? body = request.Content is null ? null : await request.Content.ReadAsByteArrayAsync(cancellationToken);

        for (int attempt = 0; ; attempt++)
        {
            HttpRequestMessage attemptRequest = Clone(request, body);
            CancellationTokenSource attemptCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            attemptCts.CancelAfter(AttemptTimeout);

            bool responseOwnsAttempt = false;

            try
            {
                HttpResponseMessage response = await base.SendAsync(attemptRequest, attemptCts.Token);

                TimeSpan? delay = null;

                if (ShouldRetry(response.StatusCode) && attempt < MaxRetries)
                {
                    TimeSpan candidate = RetryAfter(response) ?? Backoff(attempt);

                    if (candidate <= MaxRetryDelay)
                        delay = candidate;
                }

                if (delay is null)
                {
                    attemptCts.CancelAfter(Timeout.InfiniteTimeSpan);
                    response.Content = new AttemptScopedContent(response.Content, attemptRequest, attemptCts);
                    responseOwnsAttempt = true;

                    return response;
                }

                _logger.LogWarning("HTTP {Status} on {Url} — retry {Attempt}/{Max} in {Delay}",
                    (int)response.StatusCode, attemptRequest.RequestUri, attempt + 1, MaxRetries, delay.Value);

                response.Dispose();
                await Task.Delay(delay.Value, cancellationToken);
            }
            catch (Exception ex) when (
                attempt < MaxRetries
                && !cancellationToken.IsCancellationRequested
                && (ex is HttpRequestException || ex is OperationCanceledException))
            {
                TimeSpan delay = Backoff(attempt);
                _logger.LogWarning(ex, "Network failure on {Url} — retry {Attempt}/{Max} in {Delay}",
                    attemptRequest.RequestUri, attempt + 1, MaxRetries, delay);

                await Task.Delay(delay, cancellationToken);
            }
            finally
            {
                if (!responseOwnsAttempt)
                {
                    attemptRequest.Dispose();
                    attemptCts.Dispose();
                }
            }
        }
    }

    private static bool ShouldRetry(HttpStatusCode status) =>
        status == HttpStatusCode.RequestTimeout
        || status == HttpStatusCode.TooManyRequests
        || (int)status >= 500;

    private static TimeSpan Backoff(int attempt)
    {
        double seconds = Math.Pow(2, attempt) * 0.5;
        double jitter = Random.Shared.NextDouble() * 0.25;

        return TimeSpan.FromSeconds(seconds + jitter);
    }

    private static TimeSpan? RetryAfter(HttpResponseMessage response)
    {
        System.Net.Http.Headers.RetryConditionHeaderValue? retryAfter = response.Headers.RetryAfter;

        if (retryAfter is null) return null;
        if (retryAfter.Delta is { } delta && delta > TimeSpan.Zero) return delta;
        if (retryAfter.Date is { } date)
        {
            TimeSpan wait = date - DateTimeOffset.UtcNow;
            if (wait > TimeSpan.Zero) return wait;
        }

        return null;
    }

    private static HttpRequestMessage Clone(HttpRequestMessage request, byte[]? body)
    {
        HttpRequestMessage clone = new HttpRequestMessage(request.Method, request.RequestUri)
        {
            Version = request.Version
        };

        foreach (KeyValuePair<string, IEnumerable<string>> header in request.Headers)
            clone.Headers.TryAddWithoutValidation(header.Key, header.Value);

        if (body is not null)
        {
            clone.Content = new ByteArrayContent(body);
            if (request.Content?.Headers is not null)
                foreach (KeyValuePair<string, IEnumerable<string>> header in request.Content.Headers)
                    clone.Content.Headers.TryAddWithoutValidation(header.Key, header.Value);
        }

        return clone;
    }

    private sealed class AttemptScopedContent : HttpContent
    {
        private readonly HttpContent _inner;
        private readonly IDisposable[] _attemptResources;

        public AttemptScopedContent(HttpContent inner, params IDisposable[] attemptResources)
        {
            _inner = inner;
            _attemptResources = attemptResources;

            foreach (KeyValuePair<string, IEnumerable<string>> header in inner.Headers)
                Headers.TryAddWithoutValidation(header.Key, header.Value);
        }

        protected override Task SerializeToStreamAsync(Stream stream, TransportContext? context) =>
            _inner.CopyToAsync(stream);

        protected override Task<Stream> CreateContentReadStreamAsync() => _inner.ReadAsStreamAsync();

        protected override bool TryComputeLength(out long length)
        {
            if (_inner.Headers.ContentLength is long contentLength)
            {
                length = contentLength;
                return true;
            }

            length = 0;
            return false;
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                _inner.Dispose();

                foreach (IDisposable resource in _attemptResources)
                    resource.Dispose();
            }

            base.Dispose(disposing);
        }
    }
}
