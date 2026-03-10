namespace TMAflow.Domain.Models;

public class Runtime
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TechProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public DateTime? EolDate { get; set; }
    public bool IsEol { get; set; } = false;

    public TechProject TechProject { get; set; } = null!;
}
