using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class ProjectHealthSnapshotRepository : CrudEntityWithIdRepository<ProjectHealthSnapshot>,
    IProjectHealthSnapshotRepository
{
    public ProjectHealthSnapshotRepository(SentinelContext context) : base(context) { }

    public Task<ProjectHealthSnapshot?> GetOrDefaultForDayAsync(Guid projectId, DateOnly day, QueryTracking tracking,
        CancellationToken cancellationToken) =>
        Query(tracking).FirstOrDefaultAsync(s => s.ProjectId == projectId && s.Day == day, cancellationToken);
}
