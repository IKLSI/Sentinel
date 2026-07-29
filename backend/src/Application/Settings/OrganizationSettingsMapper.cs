using Sentinel.Domain.DTOs.Settings;
using Sentinel.Domain.Models;

namespace Sentinel.Application.Settings;

public static class OrganizationSettingsMapper
{
    public static OrganizationSettingsDto ToDto(Organization organization) => new()
    {
        Name = organization.Name,
        Slug = organization.Slug,
        SecurityAlertsEnabled = organization.SecurityAlertsEnabled,
        AlertMinSeverity = organization.AlertMinSeverity,
        CreatedAt = organization.CreatedAt,
    };
}
