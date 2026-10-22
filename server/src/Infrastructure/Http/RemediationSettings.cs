namespace Sentinel.Infrastructure.Http;

public class RemediationSettings
{
    public string GitHubToken { get; set; } = string.Empty;
    public string WorkflowRepository { get; set; } = string.Empty;
    public string WorkflowFile { get; set; } = string.Empty;
    public string WorkflowRef { get; set; } = string.Empty;
    public string CallbackBaseUrl { get; set; } = string.Empty;
}
