using Sentinel.Domain.Abstractions.Persistence;
namespace Sentinel.Domain.Models;

public class Runtime : IEntityWithId
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public DateTime? EolDate { get; set; }
    public bool IsEol { get; set; } = false;

    public Project Project { get; set; } = null!;
}
