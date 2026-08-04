using Sentinel.Domain.Models;

namespace Sentinel.Application.Settings;

public static class OrganizationSettingsMapper
{
    public static OrganizationSettingsDto ToDto(Organization organization) => new()
    {
        Name = organization.Name,
        SecurityAlertsEnabled = organization.SecurityAlertsEnabled,
        AlertMinSeverity = organization.AlertMinSeverity,
    };
}
