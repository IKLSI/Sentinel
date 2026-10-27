using Sentinel.Application.Projects.Create;

namespace Sentinel.Application.Projects.Import;

public class ImportProjectsDto
{
    public List<CreateProjectDto> Projects { get; set; } = [];
}
