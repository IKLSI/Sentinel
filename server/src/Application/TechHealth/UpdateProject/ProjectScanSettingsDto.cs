using Sentinel.Domain.Entities;
using Sentinel.Application.Common.Contracts;
namespace Sentinel.Application.TechHealth.UpdateProject;

public class ProjectScanSettingsDto
{
    [EnumValues(typeof(ScanFrequency))]
    public required string ScanFrequency { get; init; }
    public string? Branch { get; init; }
    public string? RootPath { get; init; }
}
