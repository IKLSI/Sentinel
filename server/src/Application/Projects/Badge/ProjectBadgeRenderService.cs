using System.Text.RegularExpressions;
using Microsoft.Extensions.Caching.Memory;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Projects.Badge;

public partial class ProjectBadgeRenderService(
    IProjectRepository projectRepository,
    ISystemScope systemScope,
    IMemoryCache cache) : IService
{
    public async Task<Result<VersionedContent>> ExecuteAsync(string token, CancellationToken cancellationToken)
    {
        if (!TokenPattern().IsMatch(token))
            return Result<VersionedContent>.Success(BadgeSvgRenderer.RenderContent(BadgeSvgRenderer.DefaultLabel, null, null));

        string cacheKey = CacheKeys.ProjectBadge(token);

        if (cache.TryGetValue(cacheKey, out VersionedContent? cached) && cached != null)
            return Result<VersionedContent>.Success(cached);

        ProjectBadgeRow? row;

        using (systemScope.Enter())
        {
            row = await projectRepository.GetOrDefaultBadgeByTokenAcrossTenantsAsync(token, cancellationToken);
        }

        VersionedContent content = row switch
        {
            { HealthScore: { } score, HealthGrade: { } grade } => BadgeSvgRenderer.RenderContent(row.Name, grade, score),
            not null => BadgeSvgRenderer.RenderContent(row.Name, null, null),
            _ => BadgeSvgRenderer.RenderContent(BadgeSvgRenderer.DefaultLabel, null, null)
        };

        cache.Set(cacheKey, content, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = CacheKeys.ProjectBadgeTtl,
            Size = 1
        });

        return Result<VersionedContent>.Success(content);
    }

    [GeneratedRegex(@"^[A-Za-z0-9_-]{16,64}$")]
    private static partial Regex TokenPattern();
}
