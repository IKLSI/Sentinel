using Hangfire;
using Sentinel.API.Jobs;

namespace Sentinel.API.Extensions;

public static class WebApplicationExtensions
{
    public static WebApplication ConfigureHangfire(this WebApplication app)
    {
        RecurringJob.AddOrUpdate<TechHealthScanJob>(
            "tech-health-scan",
            job => job.ExecuteAsync(),
            Cron.Daily(2));

        return app;
    }
}
