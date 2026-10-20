using System.Net;
using Microsoft.Extensions.Http.Resilience;
using Microsoft.Extensions.Logging;
using Polly;

namespace Sentinel.Infrastructure.Http;

public static class HttpRetryPolicy
{
    private const int MaxRetries = 3;
    private const string RateLimitRemainingHeader = "x-ratelimit-remaining";
    private const string RateLimitResetHeader = "x-ratelimit-reset";
    private static readonly TimeSpan AttemptTimeout = TimeSpan.FromSeconds(15);
    private static readonly TimeSpan MaxRetryDelay = TimeSpan.FromSeconds(30);
    private static readonly TimeSpan BaseDelay = TimeSpan.FromMilliseconds(500);

    public static void Configure(ResiliencePipelineBuilder<HttpResponseMessage> pipeline, ILogger logger)
    {
        pipeline
            .AddRetry(new HttpRetryStrategyOptions
            {
                MaxRetryAttempts = MaxRetries,
                BackoffType = DelayBackoffType.Exponential,
                UseJitter = true,
                Delay = BaseDelay,
                ShouldRetryAfterHeader = false,
                ShouldHandle = args => ValueTask.FromResult(ShouldRetry(args.Outcome, logger)),
                DelayGenerator = args => ValueTask.FromResult(ServerRequestedDelay(args.Outcome.Result)),
                OnRetry = args =>
                {
                    logger.LogWarning(args.Outcome.Exception,
                        "HTTP {Status} on {Url} — retry {Attempt}/{Max} in {Delay}",
                        (int?)args.Outcome.Result?.StatusCode, args.Outcome.Result?.RequestMessage?.RequestUri,
                        args.AttemptNumber + 1, MaxRetries, args.RetryDelay);

                    return default;
                }
            })
            .AddTimeout(AttemptTimeout);
    }

    private static bool ShouldRetry(Outcome<HttpResponseMessage> outcome, ILogger logger)
    {
        if (outcome.Result is not { } response) return HttpClientResiliencePredicates.IsTransient(outcome);

        bool rateLimited = IsRateLimited(response);

        if (!rateLimited && !HttpClientResiliencePredicates.IsTransient(outcome)) return false;

        if (ServerRequestedDelay(response) is { } delay && delay > MaxRetryDelay)
        {
            if (rateLimited)
            {
                logger.LogWarning("Rate limit exhausted on {Host}, reset at {Reset}",
                    response.RequestMessage?.RequestUri?.Host, HeaderValue(response, RateLimitResetHeader));
            }

            return false;
        }

        return true;
    }

    private static bool IsRateLimited(HttpResponseMessage response) =>
        response.StatusCode == HttpStatusCode.Forbidden
        && (response.Headers.RetryAfter != null || HeaderValue(response, RateLimitRemainingHeader) == "0");

    private static TimeSpan? ServerRequestedDelay(HttpResponseMessage? response) =>
        response == null ? null : RetryAfter(response) ?? RateLimitReset(response);

    private static TimeSpan? RateLimitReset(HttpResponseMessage response)
    {
        if (!long.TryParse(HeaderValue(response, RateLimitResetHeader), out long resetEpochSeconds)) return null;

        TimeSpan wait = DateTimeOffset.FromUnixTimeSeconds(resetEpochSeconds) - DateTimeOffset.UtcNow;

        return wait > TimeSpan.Zero ? wait : TimeSpan.Zero;
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

    private static string? HeaderValue(HttpResponseMessage response, string name) =>
        response.Headers.TryGetValues(name, out IEnumerable<string>? values) ? values.FirstOrDefault() : null;
}
