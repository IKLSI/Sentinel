using Sentinel.Domain.Models;

namespace Sentinel.Application.Settings;

public class OrganizationSettingsDto
{
    public string Name { get; set; } = string.Empty;
    public bool SecurityAlertsEnabled { get; set; }
    public VulnerabilitySeverity AlertMinSeverity { get; set; }
}
