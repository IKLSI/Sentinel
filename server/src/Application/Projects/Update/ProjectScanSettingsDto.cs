using Sentinel.Application.Common.Contracts;
using Sentinel.Domain.Entities;
namespace Sentinel.Application.Projects.Update;

public class ProjectScanSettingsDto
{
    [EnumValues(typeof(ScanFrequency))]
    public required string ScanFrequency { get; init; }
    public string? Branch { get; init; }
    public string? RootPath { get; init; }
}
