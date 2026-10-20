namespace Sentinel.Domain.Repositories;

public interface IDataRetentionRepository
{
    Task<int> DeleteExpiredPasswordResetTokensAsync(DateTime expiredBefore, CancellationToken cancellationToken);

    Task<int> DeleteExpiredEmailVerificationTokensAsync(DateTime expiredBefore, CancellationToken cancellationToken);

    Task<int> DeleteExpiredInvitationsAsync(DateTime expiredBefore, CancellationToken cancellationToken);

    Task<int> DeleteAuditLogsAsync(DateTime createdBefore, CancellationToken cancellationToken);

    Task<int> DeleteHealthSnapshotsAsync(DateOnly dayBefore, CancellationToken cancellationToken);

    Task<int> DeleteVulnerabilityResolutionsAsync(DateTime resolvedBefore, CancellationToken cancellationToken);
}
