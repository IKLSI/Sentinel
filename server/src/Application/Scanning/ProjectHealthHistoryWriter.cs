using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.Scanning;

public class ProjectHealthHistoryWriter(
    IProjectHealthSnapshotRepository snapshotRepository,
    IVulnerabilityResolutionRepository resolutionRepository)
{
    public async Task StageSnapshotAsync(Project project, DateTime scannedAt, CancellationToken cancellationToken)
    {
        if (project.HealthScore is not int score || project.HealthGrade is not string grade) return;

        DateOnly day = DateOnly.FromDateTime(scannedAt);

        ProjectHealthSnapshot? snapshot = await snapshotRepository.GetOrDefaultForDayAsync(project.Id, day,
            QueryTracking.Tracked, cancellationToken);

        if (snapshot != null)
        {
            snapshot.Score = score;
            snapshot.Grade = grade;
            return;
        }

        await snapshotRepository.AddAsync(new ProjectHealthSnapshot
        {
            OrganizationId = project.OrganizationId,
            ProjectId = project.Id,
            Day = day,
            Score = score,
            Grade = grade,
        }, cancellationToken);
    }

    public async Task StageResolutionsAsync(Project project, IReadOnlyDictionary<string, DateTime> previousDetections,
        DateTime scannedAt, CancellationToken cancellationToken)
    {
        HashSet<string> currentCveIds = project.Dependencies
            .SelectMany(dependency => dependency.Vulnerabilities)
            .Select(VulnerabilityIdentity.Of)
            .ToHashSet();

        IEnumerable<VulnerabilityResolution> resolutions = previousDetections
            .Where(detection => !currentCveIds.Contains(detection.Key))
            .Select(detection => new VulnerabilityResolution
            {
                OrganizationId = project.OrganizationId,
                ProjectId = project.Id,
                CveId = detection.Key,
                DetectedAt = detection.Value,
                ResolvedAt = scannedAt,
            });

        await resolutionRepository.AddRangeAsync(resolutions, cancellationToken);
    }
}
