using Hangfire;
using Sentinel.API.Authorization;
using Sentinel.API.Jobs;

namespace Sentinel.API.Extensions;

public static class WebApplicationExtensions
{
    public static WebApplication ConfigureHangfire(this WebApplication app)
    {
        app.UseHangfireDashboard("/hangfire", new DashboardOptions
        {
            Authorization = [new HangfireDashboardAuthorizationFilter(app.Configuration)]
        });

        RecurringJob.AddOrUpdate<TechHealthScanJob>(
            "tech-health-scan",
            job => job.ExecuteAsync(),
            Cron.Daily(2));

        return app;
    }
}
