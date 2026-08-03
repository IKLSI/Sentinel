using Hangfire;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Common;

namespace Sentinel.Application.Jobs.TriggerTechHealthScan;

public class TechHealthScanTriggerService(IRecurringJobManager recurringJobs) : IService
{
    public Result<ApiMessageResponse> Execute()
    {
        recurringJobs.Trigger(RecurringJobIds.TechHealthScan);

        return ApiMessageResponse.Create(SuccessCodes.JobTriggered);
    }
}
