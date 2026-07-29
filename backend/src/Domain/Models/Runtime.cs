namespace Sentinel.Domain.Models;

public class Runtime
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public DateTime? EolDate { get; set; }
    public bool IsEol { get; set; } = false;

    public Project Project { get; set; } = null!;
}
