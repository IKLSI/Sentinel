using Sentinel.Application.Dashboard;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.Suppressions;

public class ProjectHealthRecalculator(
    IProjectRepository projectRepository,
    IVulnerabilitySuppressionRepository suppressionRepository,
    DashboardCache dashboardCache)
{
    public async Task<HashSet<Guid>> SuppressedVulnerabilityIdsAsync(Project project,
        CancellationToken cancellationToken)
    {
        IReadOnlySet<string> suppressedKeys = await suppressionRepository
            .ListActiveFindingKeysAsync(project.Id, DateTime.UtcNow, cancellationToken);

        return SuppressedVulnerabilities.IdsIn(project, suppressedKeys);
    }

    public async Task RecalculateAsync(Guid organizationId, Guid projectId, CancellationToken cancellationToken)
    {
        Project? project = (await projectRepository.ListScoringGraphsByIdsAsync(organizationId, [projectId],
            cancellationToken)).FirstOrDefault();

        if (project == null || project.Coverage != ScanCoverage.Covered) return;

        HashSet<Guid> suppressedIds = await SuppressedVulnerabilityIdsAsync(project, cancellationToken);

        int healthScore = HealthScoreCalculator.Calculate(project, v => suppressedIds.Contains(v.Id));

        await projectRepository.UpdateHealthAsync(projectId, healthScore, HealthScoreCalculator.ToGrade(healthScore),
            cancellationToken);

        dashboardCache.Invalidate(project.OrganizationId);
    }
}
