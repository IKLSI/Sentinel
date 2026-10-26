using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.TechHealth.ProjectSearch;

public class ProjectSearchService(
    IProjectRepository projectRepository,
    IDependencyRepository dependencyRepository,
    ITenantContext tenant,
    ProjectSearchValidator validator) : IService
{
    private const int MinDependencyTermLength = 2;
    private const int MaxDependencyMatches = 5000;
    private const int DisplayedMatchesPerProject = 3;

    public async Task<Result<List<ProjectSearchMatchDto>>> ExecuteAsync(ProjectSearchModel model,
        CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<List<ProjectSearchMatchDto>>.Unauthorized();

        Result validationResult = await validator.ValidateAsync(model, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<List<ProjectSearchMatchDto>>.From(validationResult);

        string term = model.Q?.Trim() ?? string.Empty;

        IReadOnlyList<ProjectSummaryRow> projects =
            await projectRepository.ListSummariesByHealthRankAsync(organizationId, cancellationToken);

        Dictionary<Guid, List<DependencyMatchRow>> dependencyMatches = term.Length < MinDependencyTermLength
            ? []
            : (await dependencyRepository.SearchByNameAsync(organizationId, term, MaxDependencyMatches,
                cancellationToken))
            .GroupBy(row => row.ProjectId)
            .ToDictionary(group => group.Key, group => group.ToList());

        return projects
            .Where(project => project.Name.Contains(term, StringComparison.OrdinalIgnoreCase)
                || dependencyMatches.ContainsKey(project.Id))
            .Select(project => ToDto(project.Id, dependencyMatches.GetValueOrDefault(project.Id) ?? []))
            .ToList();
    }

    private static ProjectSearchMatchDto ToDto(Guid projectId, List<DependencyMatchRow> matches) => new()
    {
        ProjectId = projectId,
        DependencyMatchCount = matches.Count,
        Dependencies = matches
            .Take(DisplayedMatchesPerProject)
            .Select(match => new DependencyMatchDto
            {
                Name = match.Name,
                Version = match.Version,
                Ecosystem = match.Ecosystem.ToString(),
                Status = match.Status.ToString(),
                IsDirect = match.IsDirect
            })
            .ToList()
    };
}
