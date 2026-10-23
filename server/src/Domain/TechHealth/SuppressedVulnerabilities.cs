using Sentinel.Domain.Entities;

namespace Sentinel.Domain.TechHealth;

public static class SuppressedVulnerabilities
{
    public static HashSet<Guid> IdsIn(Project project, IReadOnlySet<string> suppressedFindingKeys) =>
        project.Dependencies
            .SelectMany(dependency => dependency.Vulnerabilities
                .Where(vulnerability => suppressedFindingKeys.Contains(
                    FindingKeys.ForVulnerability(dependency, vulnerability)))
                .Select(vulnerability => vulnerability.Id))
            .ToHashSet();
}
