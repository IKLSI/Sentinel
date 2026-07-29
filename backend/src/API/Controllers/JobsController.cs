using Asp.Versioning;
using Hangfire;
using Hangfire.Storage;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sentinel.API.Attributes;
using Sentinel.API.Jobs;
using Sentinel.Domain.Models;

namespace Sentinel.API.Controllers;

public record RecurringJobStatusDto(
    string Id,
    string Cron,
    string? LastJobState,
    DateTime? LastExecution,
    DateTime? NextExecution,
    string? Error
);

[ApiController]
[ApiVersion("1.0")]
[Route("api/jobs")]
[Route("api/v{version:apiVersion}/jobs")]
[Authorize]
[AuthorizeRoles(UserRole.Admin)]
public class JobsController : BaseController
{
    private readonly IBackgroundJobClient _backgroundJobs;

    public JobsController(IBackgroundJobClient backgroundJobs)
    {
        _backgroundJobs = backgroundJobs;
    }

    [HttpGet]
    public IActionResult GetRecurringJobs()
    {
        using IStorageConnection connection = JobStorage.Current.GetConnection();

        List<Hangfire.Storage.RecurringJobDto> jobs = connection.GetRecurringJobs();

        List<RecurringJobStatusDto> result = jobs.Select(j => new RecurringJobStatusDto(
            j.Id,
            j.Cron,
            j.LastJobState,
            j.LastExecution,
            j.NextExecution,
            j.Error
        )).ToList();

        return Ok(result);
    }

    [HttpPost("tech-health-scan/trigger")]
    public IActionResult TriggerTechHealthScan()
    {
        _backgroundJobs.Enqueue<TechHealthScanJob>(j => j.ExecuteAsync());
        return Ok(new { message = "Job déclenché avec succès" });
    }
}
