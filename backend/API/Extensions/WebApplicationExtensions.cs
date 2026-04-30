using Hangfire;
using Sentinel.API.Jobs;

namespace Sentinel.API.Extensions;

public static class WebApplicationExtensions
{
    public static WebApplication ConfigureHangfire(this WebApplication app)
    {
        IRecurringJobManager recurringJobs = app.Services.GetRequiredService<IRecurringJobManager>();
        recurringJobs.AddOrUpdate<TechHealthScanJob>(
            "tech-health-scan",
            job => job.ExecuteAsync(),
            Cron.Daily(2));

        return app;
    }
}
