using Sentinel.Application.Common.Contracts;
using Sentinel.Domain.Entities;

namespace Sentinel.Application.TechHealth.ProjectSearch;

public class ProjectSearchMatchDto
{
    public Guid ProjectId { get; set; }
    public List<DependencyMatchDto> Dependencies { get; set; } = [];
    public int DependencyMatchCount { get; set; }
}

public class DependencyMatchDto
{
    public string Name { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    [EnumValues(typeof(DependencyStatus))]
    public string Status { get; set; } = string.Empty;
}
