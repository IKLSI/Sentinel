using Sentinel.Domain.Abstractions.Persistence;
namespace Sentinel.Domain.Entities;

public class ProjectHealthSnapshot : IEntityWithId
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid OrganizationId { get; set; }
    public Guid ProjectId { get; set; }
    public DateOnly Day { get; set; }
    public int Score { get; set; }
    public string Grade { get; set; } = string.Empty;

    public Project Project { get; set; } = null!;
}
