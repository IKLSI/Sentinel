namespace Sentinel.Application.TechHealth.GetProjectOverview;

public class ProjectOverviewDto : ProjectHeaderDto
{
    public List<DependencyDto> VulnerableDependencies { get; set; } = new();
}
