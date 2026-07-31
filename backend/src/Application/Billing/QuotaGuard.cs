using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Billing;

public class QuotaGuard(
    IOrganizationRepository organizationRepository,
    IProjectRepository projectRepository,
    IUserRepository userRepository,
    IUserInvitationRepository invitationRepository,
    ISystemScope systemScope)
{
    public async Task<Result> EnsureCanAddProjectAsync(Guid organizationId, CancellationToken cancellationToken)
    {
        PlanLimits limits = await GetLimitsAsync(organizationId, cancellationToken);
        int current = await projectRepository.CountByOrganizationAsync(organizationId, cancellationToken);

        if (PlanLimits.IsWithin(current, limits.MaxProjects))
            return Result.Success();

        return Result.PaymentRequired(ErrorCodes.QuotaProjectsExceeded,
            new Dictionary<string, string> { ["limit"] = limits.MaxProjects.ToString() });
    }

    public async Task<Result> EnsureCanInviteMemberAsync(Guid organizationId, CancellationToken cancellationToken)
    {
        PlanLimits limits = await GetLimitsAsync(organizationId, cancellationToken);

        int activeMembers = await userRepository.CountActiveAsync(organizationId, cancellationToken);
        int pendingInvitations = await invitationRepository.CountPendingAsync(organizationId, cancellationToken);

        if (PlanLimits.IsWithin(activeMembers + pendingInvitations, limits.MaxMembers))
            return Result.Success();

        return Result.PaymentRequired(ErrorCodes.QuotaMembersExceeded,
            new Dictionary<string, string> { ["limit"] = limits.MaxMembers.ToString() });
    }

    public async Task<Result> EnsureScanFrequencyAllowedAsync(Guid organizationId, ScanFrequency frequency,
        CancellationToken cancellationToken)
    {
        PlanLimits limits = await GetLimitsAsync(organizationId, cancellationToken);

        if (limits.AllowsFrequency(frequency))
            return Result.Success();

        return Result.PaymentRequired(ErrorCodes.ProjectScanFrequencyAbovePlan,
            new Dictionary<string, string> { ["maxFrequency"] = limits.MaxScanFrequency.ToString() });
    }

    public async Task<Result> TryConsumeScanAsync(Guid organizationId, CancellationToken cancellationToken)
    {
        using IDisposable elevation = systemScope.Enter();

        PlanLimits limits = PlanLimits.For(
            await organizationRepository.GetEffectivePlanTierOrDefaultAsync(organizationId, cancellationToken));

        bool consumed = await organizationRepository.TryConsumeScanQuotaAsync(organizationId,
            limits.MaxScansPerMonth, cancellationToken);

        if (consumed)
            return Result.Success();

        DateTime periodStart = await organizationRepository
            .GetScanPeriodStartOrDefaultAsync(organizationId, cancellationToken);

        return Result.PaymentRequired(ErrorCodes.QuotaScansExceeded,
            new Dictionary<string, string>
            {
                ["limit"] = limits.MaxScansPerMonth.ToString(),
                ["resetAt"] = periodStart.AddMonths(1).ToString("O")
            });
    }

    public async Task RefundScanAsync(Guid organizationId, CancellationToken cancellationToken)
    {
        using IDisposable elevation = systemScope.Enter();

        await organizationRepository.RefundScanQuotaAsync(organizationId, cancellationToken);
    }

    public async Task<Result<Organization>> LoadOrganizationAsync(Guid organizationId,
        CancellationToken cancellationToken)
    {
        Organization? organization = await organizationRepository.GetOrDefaultAsync(organizationId,
            QueryTracking.Tracked, cancellationToken);

        if (organization == null)
            return Result<Organization>.NotFound(ErrorCodes.NotFound);

        return organization;
    }

    public async Task ResetScanPeriodIfElapsedAsync(Guid organizationId, CancellationToken cancellationToken)
    {
        using IDisposable elevation = systemScope.Enter();

        await organizationRepository.ResetScanPeriodIfElapsedAsync(organizationId, cancellationToken);
    }

    private async Task<PlanLimits> GetLimitsAsync(Guid organizationId, CancellationToken cancellationToken)
    {
        using IDisposable elevation = systemScope.Enter();

        PlanTier tier = await organizationRepository.GetEffectivePlanTierOrDefaultAsync(organizationId, cancellationToken);

        return PlanLimits.For(tier);
    }
}
