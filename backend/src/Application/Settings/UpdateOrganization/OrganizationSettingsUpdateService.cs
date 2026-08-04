using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Audit;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Realtime;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Settings.UpdateOrganization;

public class OrganizationSettingsUpdateService(
    IOrganizationRepository organizationRepository,
    ICommitScopeFactory commitScopeFactory,
    IAuditLogService auditLog,
    IRealtimeNotifier realtimeNotifier,
    ITenantContext tenant,
    OrganizationSettingsUpdateValidator validator) : IService
{
    public async Task<Result<OrganizationSettingsDto>> ExecuteAsync(UpdateOrganizationSettingsDto model,
        CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<OrganizationSettingsDto>.Unauthorized();

        Organization? organization = await organizationRepository.GetOrDefaultAsync(organizationId,
            QueryTracking.Tracked, cancellationToken);

        if (organization == null)
            return Result<OrganizationSettingsDto>.NotFound();

        Result validationResult = await validator.ValidateAsync(model, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<OrganizationSettingsDto>.From(validationResult);

        using (ICommitScope commitScope = commitScopeFactory.Begin())
        {
            organization.Name = model.Name.Trim();
            organization.SecurityAlertsEnabled = model.SecurityAlertsEnabled;
            organization.AlertMinSeverity = model.AlertMinSeverity;
            organization.UpdatedAt = DateTime.UtcNow;

            await commitScope.CommitAsync(cancellationToken);
        }

        await realtimeNotifier.NotifyOrganizationAsync(organizationId,
            new RealtimeEvent(RealtimeResources.Organization), cancellationToken);

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
