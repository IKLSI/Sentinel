using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class DependencyRepository : CrudEntityWithIdRepository<Dependency>, IDependencyRepository
{
    public DependencyRepository(SentinelContext context) : base(context) { }

    public IQueryable<Dependency> GetByProject(Guid projectId, QueryableQueryOptions options) =>
        GetAll(options).Where(d => d.ProjectId == projectId);

    public Task<int> DeleteByProjectAsync(Guid projectId, CancellationToken cancellationToken) =>
        GetByProject(projectId, QueryableQueryOptions.Tracked).ExecuteDeleteAsync(cancellationToken);
}

public class VulnerabilityRepository : CrudEntityWithIdRepository<Vulnerability>, IVulnerabilityRepository
{
    public VulnerabilityRepository(SentinelContext context) : base(context) { }

    public IQueryable<Vulnerability> GetByProject(Guid projectId, QueryableQueryOptions options) =>
        GetAll(options).Where(v => v.Dependency.ProjectId == projectId);

    public IQueryable<Vulnerability> GetByOrganization(Guid organizationId, QueryableQueryOptions options) =>
        GetAll(options).Where(v => v.Dependency.Project.OrganizationId == organizationId);

    public Task<int> DeleteByProjectAsync(Guid projectId, CancellationToken cancellationToken) =>
        GetByProject(projectId, QueryableQueryOptions.Tracked).ExecuteDeleteAsync(cancellationToken);
}

public class RuntimeRepository : CrudEntityWithIdRepository<Runtime>, IRuntimeRepository
{
    public RuntimeRepository(SentinelContext context) : base(context) { }

    public IQueryable<Runtime> GetByProject(Guid projectId, QueryableQueryOptions options) =>
        GetAll(options).Where(r => r.ProjectId == projectId);

    public Task<int> DeleteByProjectAsync(Guid projectId, CancellationToken cancellationToken) =>
        GetByProject(projectId, QueryableQueryOptions.Tracked).ExecuteDeleteAsync(cancellationToken);
}
