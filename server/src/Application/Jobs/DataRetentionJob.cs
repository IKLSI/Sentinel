using Microsoft.Extensions.Logging;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Jobs;

public class DataRetentionJob(
    IDataRetentionRepository retention,
    ISystemScope systemScope,
    IDatabaseConnectionHolder connectionHolder,
    ILogger<DataRetentionJob> logger)
{
    private static readonly TimeSpan TokenRetention = TimeSpan.FromDays(7);
    private static readonly TimeSpan UnverifiedAccountRetention = TimeSpan.FromHours(48);
    private static readonly TimeSpan InvitationRetention = TimeSpan.FromDays(30);
    private static readonly TimeSpan AuditLogRetention = TimeSpan.FromDays(365);
    private static readonly TimeSpan HealthHistoryRetention = TimeSpan.FromDays(730);

    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        using IDisposable elevation = systemScope.Enter();
        await using IAsyncDisposable connection = await connectionHolder.HoldOpenAsync(cancellationToken);

        DateTime now = DateTime.UtcNow;

        int tokens = await retention.DeleteExpiredPasswordResetTokensAsync(now - TokenRetention, cancellationToken)
            + await retention.DeleteExpiredEmailVerificationTokensAsync(now - TokenRetention, cancellationToken);
        int invitations = await retention.DeleteExpiredInvitationsAsync(now - InvitationRetention, cancellationToken);
        int unverifiedOrganizations = await retention.DeleteUnverifiedOrganizationsAsync(
            now - UnverifiedAccountRetention, cancellationToken);
        int auditLogs = await retention.DeleteAuditLogsAsync(now - AuditLogRetention, cancellationToken);
        int snapshots = await retention.DeleteHealthSnapshotsAsync(
            DateOnly.FromDateTime(now - HealthHistoryRetention), cancellationToken);
        int resolutions = await retention.DeleteVulnerabilityResolutionsAsync(now - HealthHistoryRetention,
            cancellationToken);

        logger.LogInformation(
            "Data retention purge: {Tokens} tokens, {Invitations} invitations, {UnverifiedOrganizations} unverified organizations, {AuditLogs} audit logs, " +
            "{Snapshots} health snapshots, {Resolutions} vulnerability resolutions deleted",
            tokens, invitations, unverifiedOrganizations, auditLogs, snapshots, resolutions);
    }
}
