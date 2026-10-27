namespace Sentinel.Application.Projects.Update;

public class UpdateProjectDto
{
    public string ScanFrequency { get; set; } = "Weekly";
    public string? Branch { get; set; }
    public string? RootPath { get; set; }
}
