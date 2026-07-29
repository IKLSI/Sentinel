using Microsoft.EntityFrameworkCore;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
using Sentinel.Application.Exports;
using Sentinel.Application.Notifications;
using Sentinel.Application.Security;
using Sentinel.Application.TechHealth;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.DTOs.TechHealth;
using Sentinel.Domain.Models;
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

        List<Project> projects = await projectRepository
            .GetByOrganization(organizationId, new QueryableQueryOptions { AsNoTracking = true, AsSplitQuery = true })
            .Include(p => p.Dependencies).ThenInclude(d => d.Vulnerabilities)
            .Include(p => p.Runtimes)
            .OrderByDescending(p => p.Dependencies.Any(d => d.Vulnerabilities.Any(v => v.Severity == VulnerabilitySeverity.Critical)))
            .ThenBy(p => p.Coverage == ScanCoverage.Covered ? 0 : 1)
            .ThenBy(p => p.HealthScore)
            .ThenBy(p => p.Name)
            .ToListAsync(cancellationToken);

        List<Guid> projectIds = projects.Select(p => p.Id).ToList();

        Dictionary<Guid, int> ticketCounts = await ticketRepository
            .GetByProjects(projectIds, QueryableQueryOptions.ReadOnly)
            .GroupBy(t => t.ProjectId!.Value)
            .Select(g => new { ProjectId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ProjectId, x => x.Count, cancellationToken);

        return projects.Select(project =>
        {
            ProjectDto dto = TechHealthService.MapToDto(project);
            dto.TotalTickets = ticketCounts.GetValueOrDefault(project.Id);
            return dto;
        }).ToList();
    }
}
