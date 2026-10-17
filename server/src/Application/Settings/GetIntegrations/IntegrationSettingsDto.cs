namespace Sentinel.Application.Settings.GetIntegrations;

public class IntegrationSettingsDto
{
    public bool HasGithubToken { get; set; }
    public bool HasGitlabToken { get; set; }
    public string GitlabBaseUrl { get; set; } = string.Empty;
}
