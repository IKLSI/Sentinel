using Sentinel.Application.TechHealth.CreateProject;

namespace Sentinel.Application.TechHealth.ImportProjects;

public class ImportProjectsDto
{
    public List<CreateProjectDto> Projects { get; set; } = [];
}
