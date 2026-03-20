using Hangfire;
using TMAflow.API.Jobs;

namespace TMAflow.API.Extensions;

public static class WebApplicationExtensions
{
    public static WebApplication ConfigureHangfire(this WebApplication app)
    {
        app.UseHangfireDashboard("/hangfire", new DashboardOptions
        {
            Authorization = []
        });

        RecurringJob.AddOrUpdate<SlaCheckJob>(
            "sla-check",
            job => job.ExecuteAsync(),
            "*/15 * * * *");

        RecurringJob.AddOrUpdate<TechHealthScanJob>(
            "tech-health-scan",
            job => job.ExecuteAsync(),
            Cron.Daily(2));

        return app;
    }
}
