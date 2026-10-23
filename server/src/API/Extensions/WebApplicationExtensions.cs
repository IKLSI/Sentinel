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
            job => job.ExecuteAsync(CancellationToken.None),
            Cron.Daily(2));

        recurringJobs.AddOrUpdate<DataRetentionJob>(
            RecurringJobIds.DataRetention,
            job => job.ExecuteAsync(CancellationToken.None),
            Cron.Daily(3));

        recurringJobs.AddOrUpdate<SuppressionExpiryJob>(
            RecurringJobIds.SuppressionExpiry,
            job => job.ExecuteAsync(CancellationToken.None),
            Cron.Hourly());

        return app;
    }
}
