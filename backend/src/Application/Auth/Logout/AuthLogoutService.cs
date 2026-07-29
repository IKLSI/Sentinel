using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
using Sentinel.Application.Exports;
using Sentinel.Application.Notifications;
using Sentinel.Application.Security;
using Sentinel.Application.TechHealth;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Auth.Logout;

public class AuthLogoutService(
    IUserRepository userRepository,
    IUnitOfWorkManager unitOfWorkManager,
    ITokenBlacklistService blacklist,
    IAuditLogService auditLog,
    IRefreshTokenStore refreshTokenStore,
    ITenantContext tenant) : IService
{

    public async Task<Result> ExecuteAsync(CancellationToken cancellationToken)
    {
        if (tenant.UserId is not Guid userId || userId == Guid.Empty)
            return Result.Unauthorized();

        if (!string.IsNullOrEmpty(tenant.Jti) && tenant.TokenExpiresAtUtc is DateTime expiresAtUtc)
            blacklist.Revoke(tenant.Jti, expiresAtUtc);

        User? user = await userRepository.GetOrDefaultAsync(userId,
            new SingleEntityQueryOptions<User>(), cancellationToken);

        if (user != null)
        {
            using IUnitOfWork unitOfWork = unitOfWorkManager.NewUnitOfWork();

            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;
            user.TokenVersion++;

            await unitOfWork.CommitAsync(cancellationToken);
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
