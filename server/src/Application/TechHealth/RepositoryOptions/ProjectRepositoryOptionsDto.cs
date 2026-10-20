namespace Sentinel.Application.TechHealth.RepositoryOptions;

public class ProjectRepositoryOptionsDto
{
    public string? DefaultBranch { get; set; }
    public List<string> Branches { get; set; } = [];
    public List<string> Directories { get; set; } = [];
    public bool Available { get; set; }
    public bool Truncated { get; set; }
}
