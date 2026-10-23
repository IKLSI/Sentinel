using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Sentinel.Domain.Abstractions;

namespace Sentinel.Infrastructure.Http;

public class GitHubActionsRemediationRunner(
    IHttpClientFactory httpClientFactory,
    IOptions<RemediationSettings> settings,
    ILogger<GitHubActionsRemediationRunner> logger) : IRemediationRunner
{
    public const string RunNamePrefix = "Sentinel remediation ";
    private const string GitHubApiBaseUrl = "https://api.github.com";
    private const string GitHubJsonMediaType = "application/vnd.github+json";
    private const int RunLookupPageSize = 50;

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(settings.Value.GitHubToken)
        && settings.Value.WorkflowRepository.Split('/') is [{ Length: > 0 }, { Length: > 0 }]
        && !string.IsNullOrWhiteSpace(settings.Value.WorkflowFile)
        && !string.IsNullOrWhiteSpace(settings.Value.WorkflowRef)
        && Uri.TryCreate(settings.Value.CallbackBaseUrl, UriKind.Absolute, out Uri? callback)
        && callback.Scheme == Uri.UriSchemeHttps;

    public async Task<string?> StartAsync(Guid remediationId, string configTicket, string completionTicket,
        CancellationToken cancellationToken)
    {
        if (!IsConfigured) return null;

        string dispatchId = Guid.NewGuid().ToString("N");
        string runUrl = $"{settings.Value.CallbackBaseUrl.TrimEnd('/')}/api/remediation-runs/{remediationId}";

        try
        {
            using HttpRequestMessage request = BuildRequest(HttpMethod.Post, $"{WorkflowUrl()}/dispatches");
            request.Content = JsonContent.Create(new
            {
                @ref = settings.Value.WorkflowRef,
                inputs = new Dictionary<string, string>
                {
                    ["dispatch_id"] = dispatchId,
                    ["config_url"] = $"{runUrl}/config",
                    ["ticket"] = configTicket,
                    ["completion_url"] = $"{runUrl}/completion",
                    ["completion_ticket"] = completionTicket
                }
            });

            using HttpResponseMessage response = await httpClientFactory
                .CreateClient(HttpClientNames.RemediationRunner)
                .SendAsync(request, cancellationToken);

            if (response.IsSuccessStatusCode) return dispatchId;

            logger.LogWarning("GitHub Actions dispatch failed for remediation {RemediationId}: status {Status}",
                remediationId, response.StatusCode);
            return null;
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning(ex, "GitHub Actions dispatch failed for remediation {RemediationId}", remediationId);
            return null;
        }
    }

    public async Task<RemediationRunState> GetStateAsync(string runnerJobId, DateTime startedAfter,
        CancellationToken cancellationToken)
    {
        try
        {
            string created = Uri.EscapeDataString($">={startedAfter.ToUniversalTime():yyyy-MM-ddTHH:mm:ssZ}");

            using HttpRequestMessage request = BuildRequest(HttpMethod.Get,
                $"{WorkflowUrl()}/runs?event=workflow_dispatch&created={created}&per_page={RunLookupPageSize}");

            using HttpResponseMessage response = await httpClientFactory
                .CreateClient(HttpClientNames.RemediationRunner)
                .SendAsync(request, cancellationToken);

            if (response.StatusCode != HttpStatusCode.OK) return RemediationRunState.Unknown;

            JsonElement payload = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken);

            if (!payload.TryGetProperty("workflow_runs", out JsonElement runs)) return RemediationRunState.Unknown;

            JsonElement? run = runs.EnumerateArray()
                .Where(item => item.TryGetProperty("display_title", out JsonElement title)
                    && title.GetString() == $"{RunNamePrefix}{runnerJobId}")
                .Select(item => (JsonElement?)item)
                .FirstOrDefault();

            return run is JsonElement found ? StateOf(found) : RemediationRunState.Pending;
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning(ex, "GitHub Actions run lookup failed for dispatch {DispatchId}", runnerJobId);
            return RemediationRunState.Unknown;
        }
    }

    private static RemediationRunState StateOf(JsonElement run)
    {
        string? status = run.TryGetProperty("status", out JsonElement s) ? s.GetString() : null;

        if (status == "in_progress") return RemediationRunState.Running;
        if (status != "completed") return RemediationRunState.Pending;

        string? conclusion = run.TryGetProperty("conclusion", out JsonElement c) ? c.GetString() : null;

        return conclusion == "success" ? RemediationRunState.Succeeded : RemediationRunState.Failed;
    }

    private string WorkflowUrl() =>
        $"{GitHubApiBaseUrl}/repos/{settings.Value.WorkflowRepository}/actions/workflows/{Uri.EscapeDataString(settings.Value.WorkflowFile)}";

    private HttpRequestMessage BuildRequest(HttpMethod method, string url)
    {
        HttpRequestMessage request = new HttpRequestMessage(method, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", settings.Value.GitHubToken);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue(GitHubJsonMediaType));
        return request;
    }
}
