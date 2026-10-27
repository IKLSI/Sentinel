namespace Sentinel.Application.Projects.Create;

public class CreateProjectDto
{
    public string Name { get; set; } = string.Empty;
    public string? RepositoryUrl { get; set; }
    public string RepositoryType { get; set; } = "GitHub";
    public string ScanFrequency { get; set; } = "Weekly";
}
