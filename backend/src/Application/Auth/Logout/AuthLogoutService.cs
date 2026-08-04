using Microsoft.Extensions.Caching.Memory;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
using Sentinel.Application.Security;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Auth.Logout;

public class AuthLogoutService(
    IUserRepository userRepository,
    ICommitScopeFactory commitScopeFactory,
    ITokenBlacklistService blacklist,
    IAuditLogService auditLog,
    IRefreshTokenStore refreshTokenStore,
    IMemoryCache cache,
    ITenantContext tenant) : IService
{
    public async Task<Result> ExecuteAsync(CancellationToken cancellationToken)
    {
        if (tenant.UserId is not Guid userId || userId == Guid.Empty)
            return Result.Unauthorized();

        if (!string.IsNullOrEmpty(tenant.Jti) && tenant.TokenExpiresAtUtc is DateTime expiresAtUtc)
            await blacklist.RevokeAsync(tenant.Jti, expiresAtUtc, cancellationToken);

        User? user = await userRepository.GetOrDefaultAsync(userId,
            QueryTracking.Tracked, cancellationToken);

        if (user != null)
        {
            using ICommitScope commitScope = commitScopeFactory.Begin();

            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;
            user.TokenVersion++;

            await commitScope.CommitAsync(cancellationToken);

            cache.Remove(CacheKeys.AuthAccount(userId));
        }

        refreshTokenStore.Clear();

        await auditLog.LogAsync(
            AuditAction.Logout,
            entityType: AuditEntityTypes.User,
            organizationId: tenant.OrganizationId,
            userId: userId,
            entityId: userId,
            jti: tenant.Jti);

        return Result.NoContent();
    }
}
