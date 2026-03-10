namespace TMAflow.Domain.Models;

public enum DeploymentEnvironment
{
    Dev,
    Staging,
    Production
}

public class EnvironmentVersion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TechProjectId { get; set; }
    public DeploymentEnvironment Environment { get; set; } = DeploymentEnvironment.Production;
    public string Version { get; set; } = string.Empty;
    public DateTime DeployedAt { get; set; } = DateTime.UtcNow;
    public string? DeployedBy { get; set; }

    public TechProject TechProject { get; set; } = null!;
}
