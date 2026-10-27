using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Projects.Options;

public class ProjectOptionListService(
    IProjectRepository projectRepository,
    ITenantContext tenant) : IService
{
    public async Task<Result<List<ProjectOptionDto>>> ExecuteAsync(CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<List<ProjectOptionDto>>.Unauthorized();

        IReadOnlyList<ProjectOptionRow> projects =
            await projectRepository.ListOptionsByNameAsync(organizationId, cancellationToken);

        return projects.Select(project => new ProjectOptionDto { Id = project.Id, Name = project.Name }).ToList();
    }
}
