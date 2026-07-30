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
    ICommitScopeFactory commitScopeFactory,
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

    public async Task<Result> TryConsumeScanAsync(Guid organizationId, CancellationToken cancellationToken)
    {
        using IDisposable elevation = systemScope.Enter();

        Organization? organization = await organizationRepository.GetOrDefaultAsync(organizationId,
            QueryTracking.NoTracking, cancellationToken);

        if (organization == null)
            return Result.NotFound(ErrorCodes.NotFound);

        PlanLimits limits = PlanLimits.For(organization.PlanTier);

        bool consumed = await organizationRepository.TryConsumeScanQuotaAsync(organizationId,
            limits.MaxScansPerMonth, cancellationToken);

        if (consumed)
            return Result.Success();

        return Result.PaymentRequired(ErrorCodes.QuotaScansExceeded,
            new Dictionary<string, string>
            {
                ["limit"] = limits.MaxScansPerMonth.ToString(),
                ["resetAt"] = organization.ScanCountPeriodStart.AddMonths(1).ToString("O")
            });
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

    public async Task ResetScanPeriodIfElapsedAsync(Organization organization, CancellationToken cancellationToken)
    {
        if (!ScanPeriod.ResetIfElapsed(organization)) return;

        using ICommitScope commitScope = commitScopeFactory.Begin();

        await commitScope.CommitAsync(cancellationToken);
    }

    private async Task<PlanLimits> GetLimitsAsync(Guid organizationId, CancellationToken cancellationToken)
    {
        using IDisposable elevation = systemScope.Enter();

        PlanTier tier = await organizationRepository.GetPlanTierOrDefaultAsync(organizationId, cancellationToken);

        return PlanLimits.For(tier);
    }
}
