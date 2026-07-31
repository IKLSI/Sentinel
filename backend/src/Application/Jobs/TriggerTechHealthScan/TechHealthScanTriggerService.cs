using Hangfire;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Common;

namespace Sentinel.Application.Jobs.TriggerTechHealthScan;

public class TechHealthScanTriggerService(IBackgroundJobClient backgroundJobs) : IService
{
    public Result<ApiMessageResponse> Execute()
    {
        backgroundJobs.Enqueue<TechHealthScanJob>(j => j.ExecuteAsync(JobCancellationToken.Null));

        return ApiMessageResponse.Create(SuccessCodes.JobTriggered);
    }
}
