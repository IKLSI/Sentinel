using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Users;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Users.ExportData;

public class UserExportDataService(
    IUserRepository userRepository,
    IAuditLogRepository auditLogRepository,
    ITenantContext tenant) : IService
{
    public async Task<Result<UserDataExportDto>> ExecuteAsync(CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId || tenant.UserId is not Guid currentUserId)
            return Result<UserDataExportDto>.Unauthorized();

        User? user = await userRepository.GetOrDefaultInOrganizationAsync(currentUserId, organizationId,
            QueryTracking.NoTracking, cancellationToken);

        if (user == null)
            return Result<UserDataExportDto>.NotFound(ErrorCodes.UserNotFound);

        IReadOnlyList<UserExportAuditLogDto> auditLogs = await auditLogRepository
            .ListForUserExportAsync(currentUserId, cancellationToken);

        return new UserDataExportDto
        {
            ExportedAt = DateTime.UtcNow,
            Profile = new UserExportProfileDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role.ToString(),
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt,
                Language = user.Language
            },
            AuditLogs = auditLogs
        };
    }
}
