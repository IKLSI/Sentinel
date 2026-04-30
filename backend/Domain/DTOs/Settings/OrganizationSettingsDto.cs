using System.ComponentModel.DataAnnotations;

namespace Sentinel.Domain.DTOs.Settings;

public class OrganizationSettingsDto
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Timezone { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class UpdateOrganizationSettingsDto
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    [MaxLength(100)]
    public string Timezone { get; set; } = string.Empty;
}

public class IntegrationSettingsDto
{
    public bool HasGithubToken { get; set; }
    public bool HasGitlabToken { get; set; }
}

public class ConnectIntegrationDto
{
    [Required]
    [MaxLength(500)]
    public string Token { get; set; } = string.Empty;
}

public class ImportResultDto
{
    public int ImportedCount { get; set; }
    public int SkippedCount { get; set; }
}
