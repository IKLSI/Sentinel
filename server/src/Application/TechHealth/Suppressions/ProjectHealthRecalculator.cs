using Sentinel.Application.Dashboard;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.TechHealth.Suppressions;

public class ProjectHealthRecalculator(
    IProjectRepository projectRepository,
    IVulnerabilitySuppressionRepository suppressionRepository,
    ICommitScopeFactory commitScopeFactory,
    DashboardCache dashboardCache)
{
    public async Task<HashSet<Guid>> SuppressedVulnerabilityIdsAsync(Project project,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<VulnerabilitySuppression> suppressions = await suppressionRepository
            .ListActiveByProjectAsync(project.Id, DateTime.UtcNow, cancellationToken);

        return SuppressedVulnerabilities.IdsIn(project,
            suppressions.Select(suppression => suppression.FindingKey).ToHashSet());
    }

    public async Task RecalculateAsync(Guid projectId, CancellationToken cancellationToken)
    {
        Project? project = await projectRepository.GetOrDefaultWithHealthDetailsAsync(projectId,
            QueryTracking.Tracked, cancellationToken);

        if (project == null || project.Coverage != ScanCoverage.Covered) return;

        HashSet<Guid> suppressedIds = await SuppressedVulnerabilityIdsAsync(project, cancellationToken);

        using (ICommitScope commitScope = commitScopeFactory.Begin())
        {
            project.HealthScore = HealthScoreCalculator.Calculate(project, v => suppressedIds.Contains(v.Id));
            project.HealthGrade = HealthScoreCalculator.ToGrade(project.HealthScore.Value);

            await commitScope.CommitAsync(cancellationToken);
        }

        dashboardCache.Invalidate(project.OrganizationId);
    }
}
