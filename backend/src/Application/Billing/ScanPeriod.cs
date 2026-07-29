using Sentinel.Domain.Models;

namespace Sentinel.Application.Billing;

public static class ScanPeriod
{
    public static bool ResetIfElapsed(Organization organization)
    {
        if (DateTime.UtcNow < organization.ScanCountPeriodStart.AddMonths(1)) return false;

        organization.MonthlyScanCount = 0;
        organization.ScanCountPeriodStart = DateTime.UtcNow;

        return true;
    }
}
