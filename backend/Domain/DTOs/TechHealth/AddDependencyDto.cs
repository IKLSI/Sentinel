namespace TMAflow.Domain.DTOs.TechHealth;

public class AddDependencyDto
{
    public string Name { get; set; } = string.Empty;
    public string CurrentVersion { get; set; } = string.Empty;
    public string? LatestVersion { get; set; }
    public string Type { get; set; } = "Prod";
    public string Ecosystem { get; set; } = "Npm";
}
