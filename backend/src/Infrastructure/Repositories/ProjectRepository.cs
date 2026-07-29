using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class ProjectRepository : CrudEntityWithIdRepository<Project>, IProjectRepository
{
    public ProjectRepository(SentinelContext context) : base(context) { }

    public IQueryable<Project> GetByOrganization(Guid organizationId, QueryableQueryOptions options) =>
        GetAll(options).Where(p => p.OrganizationId == organizationId);

    public Task<Project?> GetOrDefaultInOrganizationAsync(Guid projectId, Guid organizationId,
        SingleEntityQueryOptions<Project> options, CancellationToken cancellationToken) =>
        options.ApplyIncludes(GetAll(options.ToQueryableQueryOptions()))
            .FirstOrDefaultAsync(p => p.Id == projectId && p.OrganizationId == organizationId, cancellationToken);

    public Task<bool> ExistsInOrganizationAsync(Guid projectId, Guid organizationId,
        CancellationToken cancellationToken) =>
        GetAll(QueryableQueryOptions.ReadOnly)
            .AnyAsync(p => p.Id == projectId && p.OrganizationId == organizationId, cancellationToken);

    public Task<int> CountByOrganizationAsync(Guid organizationId, CancellationToken cancellationToken) =>
        GetAll(QueryableQueryOptions.ReadOnly).CountAsync(p => p.OrganizationId == organizationId, cancellationToken);
}
