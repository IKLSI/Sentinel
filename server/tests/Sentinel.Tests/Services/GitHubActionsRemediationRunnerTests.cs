using System.Net;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Sentinel.Domain.Abstractions;
using Sentinel.Infrastructure.Http;

namespace Sentinel.Tests.Services;

public class GitHubActionsRemediationRunnerTests
{
    private const string WorkflowUrl =
        "https://api.github.com/repos/IKLSI/Sentinel/actions/workflows/remediation.yml";

    private sealed class StubHandler(Func<HttpRequestMessage, HttpResponseMessage> respond) : HttpMessageHandler
    {
        public List<(HttpMethod Method, Uri Uri, string? Body)> Requests { get; } = new();

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            string? body = request.Content == null ? null : await request.Content.ReadAsStringAsync(cancellationToken);
            Requests.Add((request.Method, request.RequestUri!, body));
            return respond(request);
        }
    }

    private sealed class StubHttpClientFactory(HttpMessageHandler handler) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => new(handler, disposeHandler: false);
    }

    private static RemediationSettings ConfiguredSettings() => new()
    {
        GitHubToken = "github-token",
        WorkflowRepository = "IKLSI/Sentinel",
        WorkflowFile = "remediation.yml",
        WorkflowRef = "main",
        CallbackBaseUrl = "https://api.sentinel.example/"
    };

    private static GitHubActionsRemediationRunner Runner(StubHandler handler, RemediationSettings? settings = null) =>
        new(new StubHttpClientFactory(handler), Options.Create(settings ?? ConfiguredSettings()),
            NullLogger<GitHubActionsRemediationRunner>.Instance);

    private static HttpResponseMessage Runs(string runsJson) => new(HttpStatusCode.OK)
    {
        Content = new StringContent($$"""{ "workflow_runs": {{runsJson}} }""", Encoding.UTF8, "application/json")
    };

    [Fact]
    public void IsConfigured_MissingToken_ReturnsFalse()
    {
        RemediationSettings settings = ConfiguredSettings();
        settings.GitHubToken = string.Empty;

        Runner(new StubHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)), settings)
            .IsConfigured.Should().BeFalse();
    }

    [Fact]
    public async Task StartAsync_DispatchesWorkflowWithConfigAndCompletionCallbacks()
    {
        StubHandler handler = new StubHandler(_ => new HttpResponseMessage(HttpStatusCode.NoContent));
        Guid remediationId = Guid.NewGuid();

        string? dispatchId = await Runner(handler).StartAsync(remediationId, "ticket-value", "completion-value",
            TestContext.Current.CancellationToken);

        dispatchId.Should().NotBeNullOrEmpty();
        (HttpMethod method, Uri uri, string? body) = handler.Requests.Single();
        method.Should().Be(HttpMethod.Post);
        uri.ToString().Should().Be($"{WorkflowUrl}/dispatches");

        JsonElement payload = JsonDocument.Parse(body!).RootElement;
        payload.GetProperty("ref").GetString().Should().Be("main");
        JsonElement inputs = payload.GetProperty("inputs");
        inputs.GetProperty("dispatch_id").GetString().Should().Be(dispatchId);
        inputs.GetProperty("ticket").GetString().Should().Be("ticket-value");
        inputs.GetProperty("config_url").GetString()
            .Should().Be($"https://api.sentinel.example/api/remediation-runs/{remediationId}/config");
        inputs.GetProperty("completion_ticket").GetString().Should().Be("completion-value");
        inputs.GetProperty("completion_url").GetString()
            .Should().Be($"https://api.sentinel.example/api/remediation-runs/{remediationId}/completion");
    }

    [Fact]
    public async Task StartAsync_DispatchRejected_ReturnsNull()
    {
        StubHandler handler = new StubHandler(_ => new HttpResponseMessage(HttpStatusCode.NotFound));

        string? dispatchId = await Runner(handler).StartAsync(Guid.NewGuid(), "ticket-value", "completion-value",
            TestContext.Current.CancellationToken);

        dispatchId.Should().BeNull();
    }

    [Theory]
    [InlineData("""[ { "display_title": "Sentinel remediation abc", "status": "queued", "conclusion": null } ]""", RemediationRunState.Pending)]
    [InlineData("""[ { "display_title": "Sentinel remediation abc", "status": "in_progress", "conclusion": null } ]""", RemediationRunState.Running)]
    [InlineData("""[ { "display_title": "Sentinel remediation abc", "status": "completed", "conclusion": "success" } ]""", RemediationRunState.Succeeded)]
    [InlineData("""[ { "display_title": "Sentinel remediation abc", "status": "completed", "conclusion": "failure" } ]""", RemediationRunState.Failed)]
    [InlineData("""[ { "display_title": "Sentinel remediation other", "status": "completed", "conclusion": "success" } ]""", RemediationRunState.Pending)]
    public async Task GetStateAsync_MapsTheRunMatchingTheDispatchId(string runsJson, RemediationRunState expected)
    {
        StubHandler handler = new StubHandler(_ => Runs(runsJson));

        RemediationRunState state = await Runner(handler).GetStateAsync("abc",
            new DateTime(2026, 10, 22, 14, 30, 5, DateTimeKind.Utc), TestContext.Current.CancellationToken);

        state.Should().Be(expected);
        handler.Requests.Single().Uri.AbsoluteUri.Should()
            .StartWith($"{WorkflowUrl}/runs?event=workflow_dispatch&created=%3E%3D2026-10-22T14%3A30%3A05Z");
    }
}
