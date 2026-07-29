using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Billing;
using Sentinel.Domain.Models;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Application.Services;

public class QuotaService
{
    private readonly SentinelContext _context;
    private readonly ISystemScope _systemScope;

    public QuotaService(SentinelContext context, ISystemScope systemScope)
    {
        _context = context;
        _systemScope = systemScope;
    }

    internal static bool ResetScanPeriodIfElapsed(Organization organization)
    {
        if (DateTime.UtcNow >= organization.ScanCountPeriodStart.AddMonths(1))
        {
            organization.MonthlyScanCount = 0;
            organization.ScanCountPeriodStart = DateTime.UtcNow;
            return true;
        }
        return false;
    }

    public async Task EnsureCanAddProjectAsync(Guid organizationId)
    {
        PlanLimits limits = await GetLimitsAsync(organizationId);
        int current = await _context.Projects.CountAsync(p => p.OrganizationId == organizationId);

        if (!PlanLimits.IsWithin(current, limits.MaxProjects))
            throw new QuotaExceededException(ErrorCodes.QuotaProjectsExceeded,
                new Dictionary<string, string> { ["limit"] = limits.MaxProjects.ToString() });
    }

    public async Task EnsureCanInviteMemberAsync(Guid organizationId)
    {
        PlanLimits limits = await GetLimitsAsync(organizationId);

        int activeMembers = await _context.Users.CountAsync(u => u.OrganizationId == organizationId && u.IsActive);
        int pendingInvitations = await _context.UserInvitations.CountAsync(i =>
            i.OrganizationId == organizationId && i.AcceptedAt == null && i.ExpiresAt > DateTime.UtcNow);

        if (!PlanLimits.IsWithin(activeMembers + pendingInvitations, limits.MaxMembers))
            throw new QuotaExceededException(ErrorCodes.QuotaMembersExceeded,
                new Dictionary<string, string> { ["limit"] = limits.MaxMembers.ToString() });
    }

    public async Task EnsureCanScanAsync(Guid organizationId)
    {
        using IDisposable elevation = _systemScope.Enter();

        Organization? organization = await _context.Organizations.FirstOrDefaultAsync(o => o.Id == organizationId);
        if (organization == null) throw new KeyNotFoundException();

        if (ResetScanPeriodIfElapsed(organization))
            await _context.SaveChangesAsync();

        PlanLimits limits = PlanLimits.For(organization.PlanTier);

        if (!PlanLimits.IsWithin(organization.MonthlyScanCount, limits.MaxScansPerMonth))
            throw new QuotaExceededException(ErrorCodes.QuotaScansExceeded,
                new Dictionary<string, string>
                {
                    ["limit"] = limits.MaxScansPerMonth.ToString(),
                    ["resetAt"] = organization.ScanCountPeriodStart.AddMonths(1).ToString("O")
                });
    }

    public async Task<BillingStatusDto> GetStatusAsync(Guid organizationId)
    {
        using IDisposable elevation = _systemScope.Enter();

        Organization? organization = await _context.Organizations.FirstOrDefaultAsync(o => o.Id == organizationId);
        if (organization == null) throw new KeyNotFoundException();

        if (ResetScanPeriodIfElapsed(organization))
            await _context.SaveChangesAsync();

        PlanLimits limits = PlanLimits.For(organization.PlanTier);
        int projects = await _context.Projects.CountAsync(p => p.OrganizationId == organizationId);
        int members = await _context.Users.CountAsync(u => u.OrganizationId == organizationId && u.IsActive);

        bool active = organization.SubscriptionStatus is SubscriptionStatus.Active or SubscriptionStatus.Trialing;

        return new BillingStatusDto
        {
            PlanTier = organization.PlanTier.ToString(),
            SubscriptionStatus = organization.SubscriptionStatus.ToString(),
            CurrentPeriodEnd = organization.CurrentPeriodEnd,
            HasActiveSubscription = active,
            Projects = new PlanQuotaDto { Used = projects, Limit = limits.MaxProjects },
            Members = new PlanQuotaDto { Used = members, Limit = limits.MaxMembers },
            Scans = new PlanQuotaDto { Used = organization.MonthlyScanCount, Limit = limits.MaxScansPerMonth }
        };
    }

    private async Task<PlanLimits> GetLimitsAsync(Guid organizationId)
    {
        using IDisposable elevation = _systemScope.Enter();

        PlanTier tier = await _context.Organizations
            .Where(o => o.Id == organizationId)
            .Select(o => o.PlanTier)
            .FirstOrDefaultAsync();

        return PlanLimits.For(tier);
    }
}
