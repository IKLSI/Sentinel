using Sentinel.Domain.Models;

namespace Sentinel.Domain.DTOs.Settings;

public class OrganizationSettingsDto
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public bool SecurityAlertsEnabled { get; set; }
    public VulnerabilitySeverity AlertMinSeverity { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UpdateOrganizationSettingsDto
{
    public string Name { get; set; } = string.Empty;
    public bool SecurityAlertsEnabled { get; set; }
    public VulnerabilitySeverity AlertMinSeverity { get; set; }
}

public class IntegrationSettingsDto
{
    public bool HasGithubToken { get; set; }
    public bool HasGitlabToken { get; set; }
}

public class ConnectIntegrationDto
{
    public string Token { get; set; } = string.Empty;
}

public class ImportResultDto
{
    public int ImportedCount { get; set; }
    public int SkippedCount { get; set; }
}
