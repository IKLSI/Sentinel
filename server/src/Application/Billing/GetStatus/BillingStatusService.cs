using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Billing.GetStatus;

public class BillingStatusService(
    QuotaGuard quotaGuard,
    IProjectRepository projectRepository,
    IUserRepository userRepository,
    ITenantContext tenant) : IService
{
    public async Task<Result<BillingStatusDto>> ExecuteAsync(CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<BillingStatusDto>.Unauthorized();

        await quotaGuard.ResetScanPeriodIfElapsedAsync(organizationId, cancellationToken);

        Result<Organization> organizationResult = await quotaGuard
            .LoadOrganizationAsync(organizationId, cancellationToken);

        if (!organizationResult.IsSuccess)
            return Result<BillingStatusDto>.From(organizationResult);

        Organization organization = organizationResult.Value!;

        PlanTier effectiveTier = PlanLimits.Effective(organization.PlanTier, organization.SubscriptionStatus);
        PlanLimits limits = PlanLimits.For(effectiveTier);

        int projects = await projectRepository.CountByOrganizationAsync(organizationId, cancellationToken);
        int members = await userRepository.CountActiveAsync(organizationId, cancellationToken);

        return new BillingStatusDto
        {
            PlanTier = organization.PlanTier.ToString(),
            EffectivePlanTier = effectiveTier.ToString(),
            SubscriptionStatus = organization.SubscriptionStatus.ToString(),
            Projects = new PlanQuotaDto { Used = projects, Limit = limits.MaxProjects },
            Members = new PlanQuotaDto { Used = members, Limit = limits.MaxMembers },
            Scans = new PlanQuotaDto { Used = organization.MonthlyScanCount, Limit = limits.MaxScansPerMonth }
        };
    }
}
