using Sentinel.Domain.Models;

namespace Sentinel.Application.Settings.UpdateOrganization;

public class UpdateOrganizationSettingsDto
{
    public string Name { get; set; } = string.Empty;
    public bool SecurityAlertsEnabled { get; set; }
    public VulnerabilitySeverity AlertMinSeverity { get; set; }
}
