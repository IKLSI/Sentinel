using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class DataRetentionRepository(SentinelContext context) : IDataRetentionRepository
{
    public Task<int> DeleteExpiredPasswordResetTokensAsync(DateTime expiredBefore,
        CancellationToken cancellationToken) =>
        context.Set<PasswordResetToken>()
            .Where(token => token.ExpiresAt < expiredBefore)
            .ExecuteDeleteAsync(cancellationToken);

    public Task<int> DeleteExpiredEmailVerificationTokensAsync(DateTime expiredBefore,
        CancellationToken cancellationToken) =>
        context.Set<EmailVerificationToken>()
            .Where(token => token.ExpiresAt < expiredBefore)
            .ExecuteDeleteAsync(cancellationToken);

    public Task<int> DeleteExpiredInvitationsAsync(DateTime expiredBefore, CancellationToken cancellationToken) =>
        context.Set<UserInvitation>()
            .Where(invitation => invitation.ExpiresAt < expiredBefore)
            .ExecuteDeleteAsync(cancellationToken);

    public Task<int> DeleteUnverifiedOrganizationsAsync(DateTime createdBefore, CancellationToken cancellationToken) =>
        context.Set<Organization>()
            .IgnoreQueryFilters()
            .Where(organization => organization.CreatedAt < createdBefore
                && organization.Users.Any()
                && !organization.Users.Any(user => user.IsEmailVerified))
            .ExecuteDeleteAsync(cancellationToken);

    public Task<int> DeleteAuditLogsAsync(DateTime createdBefore, CancellationToken cancellationToken) =>
        context.Set<AuditLog>()
            .Where(log => log.CreatedAt < createdBefore)
            .ExecuteDeleteAsync(cancellationToken);

    public Task<int> DeleteHealthSnapshotsAsync(DateOnly dayBefore, CancellationToken cancellationToken) =>
        context.Set<ProjectHealthSnapshot>()
            .Where(snapshot => snapshot.Day < dayBefore)
            .ExecuteDeleteAsync(cancellationToken);

    public Task<int> DeleteVulnerabilityResolutionsAsync(DateTime resolvedBefore,
        CancellationToken cancellationToken) =>
        context.Set<VulnerabilityResolution>()
            .Where(resolution => resolution.ResolvedAt < resolvedBefore)
            .ExecuteDeleteAsync(cancellationToken);
}
