namespace Sentinel.Domain.DTOs.Settings;

public class SlaSettingsDto
{
    public int CriticalHours { get; set; }
    public int HighHours { get; set; }
    public int MediumHours { get; set; }
    public int LowHours { get; set; }
}

public class UpdateSlaSettingsDto
{
    public int CriticalHours { get; set; }
    public int HighHours { get; set; }
    public int MediumHours { get; set; }
    public int LowHours { get; set; }
}

public class OrganizationSettingsDto
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Timezone { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class UpdateOrganizationSettingsDto
{
    public string Name { get; set; } = string.Empty;
    public string Timezone { get; set; } = string.Empty;
}
