using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Projects.GetAll;

public class ProjectListService(
    IProjectRepository projectRepository,
    ITenantContext tenant) : IService
{
    public async Task<Result<List<ProjectSummaryDto>>> ExecuteAsync(CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<List<ProjectSummaryDto>>.Unauthorized();

        IReadOnlyList<ProjectSummaryRow> projects =
            await projectRepository.ListSummariesByHealthRankAsync(organizationId, cancellationToken);

        return projects.Select(ToDto).ToList();
    }

    private static ProjectSummaryDto ToDto(ProjectSummaryRow project) => new()
    {
        Id = project.Id,
        Name = project.Name,
        RepositoryUrl = project.RepositoryUrl,
        Branch = project.Branch,
        RootPath = project.RootPath,
        RepositoryType = project.RepositoryType.ToString(),
        LastScanAt = project.LastScanAt,
        LastScanError = project.LastScanError,
        HealthScore = project.HealthScore,
        HealthGrade = project.HealthGrade,
        Coverage = project.Coverage.ToString(),
        ScanFrequency = project.ScanFrequency.ToString(),
        TotalDependencies = project.TotalDependencies,
        CriticalVulnerabilities = project.CriticalVulnerabilities,
        TotalVulnerabilities = project.TotalVulnerabilities,
        KnownExploitedVulnerabilities = project.KnownExploitedVulnerabilities,
        TotalTickets = project.TotalTickets
    };
}
