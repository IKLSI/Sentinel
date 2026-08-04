using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.TechHealth.Projects;

public class ProjectListService(
    IProjectRepository projectRepository,
    ITicketRepository ticketRepository,
    ITenantContext tenant) : IService
{
    public async Task<Result<List<ProjectDto>>> ExecuteAsync(CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<List<ProjectDto>>.Unauthorized();

        IReadOnlyList<Project> projects =
            await projectRepository.ListWithHealthDetailsByHealthRankAsync(organizationId, cancellationToken);

        List<Guid> projectIds = projects.Select(p => p.Id).ToList();

        IReadOnlyDictionary<Guid, int> ticketCounts =
            await ticketRepository.CountByProjectsAsync(projectIds, cancellationToken);

        return projects.Select(project =>
        {
            ProjectDto dto = ProjectMapper.ToDto(project);
            dto.TotalTickets = ticketCounts.GetValueOrDefault(project.Id);
            return dto;
        }).ToList();
    }
}
