namespace Sentinel.Application.TechHealth.UpdateProject;

public class ProjectScanSettingsDto
{
    public required string ScanFrequency { get; init; }
    public string? Branch { get; init; }
    public string? RootPath { get; init; }
}
