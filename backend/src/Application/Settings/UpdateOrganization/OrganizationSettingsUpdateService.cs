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
using Sentinel.Domain.DTOs.Settings;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Settings.UpdateOrganization;

public class OrganizationSettingsUpdateService(
    IOrganizationRepository organizationRepository,
    IUnitOfWorkManager unitOfWorkManager,
    IAuditLogService auditLog,
    ITenantContext tenant,
    OrganizationSettingsUpdateValidator validator) : IService
{

    public async Task<Result<OrganizationSettingsDto>> ExecuteAsync(UpdateOrganizationSettingsDto model,
        CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<OrganizationSettingsDto>.Unauthorized();

        Organization? organization = await organizationRepository.GetOrDefaultAsync(organizationId,
            new SingleEntityQueryOptions<Organization>(), cancellationToken);

        if (organization == null)
            return Result<OrganizationSettingsDto>.NotFound();

        Result validationResult = await validator.ValidateAsync(model, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<OrganizationSettingsDto>.From(validationResult);

        using (IUnitOfWork unitOfWork = unitOfWorkManager.NewUnitOfWork())
        {
            organization.Name = model.Name.Trim();
            organization.SecurityAlertsEnabled = model.SecurityAlertsEnabled;
            organization.AlertMinSeverity = model.AlertMinSeverity;
            organization.UpdatedAt = DateTime.UtcNow;

            await unitOfWork.CommitAsync(cancellationToken);
        }

        await auditLog.LogAsync(
            AuditAction.OrganizationUpdated,
            entityType: AuditEntityTypes.Organization,
            organizationId: organizationId,
            userId: tenant.UserId,
            entityId: organizationId,
            jti: tenant.Jti);

        return OrganizationSettingsMapper.ToDto(organization);
    }
}
