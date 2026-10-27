namespace Sentinel.Application.Projects.GetOverview;

public class ProjectOverviewDto : ProjectHeaderDto
{
    public List<DependencyDto> VulnerableDependencies { get; set; } = new();
}
