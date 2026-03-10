namespace TMAflow.Domain.Models;

public class JiraConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TechProjectId { get; set; }
    public string InstanceUrl { get; set; } = string.Empty;
    public string ApiToken { get; set; } = string.Empty;
    public string ProjectKey { get; set; } = string.Empty;
    public bool IsEnabled { get; set; } = false;
    public string StatusMapping { get; set; } = "{}";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public TechProject TechProject { get; set; } = null!;
}
