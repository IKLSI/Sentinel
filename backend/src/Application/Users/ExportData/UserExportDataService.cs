using Microsoft.EntityFrameworkCore;
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
            new SingleEntityQueryOptions<User> { AsNoTracking = true }, cancellationToken);

        if (user == null)
            return Result<UserDataExportDto>.NotFound(ErrorCodes.UserNotFound);

        List<UserExportAuditLogDto> auditLogs = await auditLogRepository
            .GetByUser(currentUserId, QueryableQueryOptions.ReadOnly)
            .OrderByDescending(al => al.CreatedAt)
            .Select(al => new UserExportAuditLogDto
            {
                Id = al.Id,
                Action = al.Action.ToString(),
                EntityType = al.EntityType,
                EntityId = al.EntityId,
                CreatedAt = al.CreatedAt
            })
            .ToListAsync(cancellationToken);

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
