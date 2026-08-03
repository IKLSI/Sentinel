using Hangfire;
using Sentinel.Application.Jobs;
using Sentinel.Domain.Constants;

namespace Sentinel.API.Extensions;

public static class WebApplicationExtensions
{
    public static WebApplication ConfigureHangfire(this WebApplication app)
    {
        IRecurringJobManager recurringJobs = app.Services.GetRequiredService<IRecurringJobManager>();
        recurringJobs.AddOrUpdate<TechHealthScanJob>(
            RecurringJobIds.TechHealthScan,
            job => job.ExecuteAsync(JobCancellationToken.Null),
            Cron.Daily(2));

        recurringJobs.AddOrUpdate<PurgeExpiredRevokedTokensJob>(
            RecurringJobIds.PurgeExpiredRevokedTokens,
            job => job.ExecuteAsync(JobCancellationToken.Null),
            Cron.Hourly());

        return app;
    }
}
