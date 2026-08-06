using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Common.Contracts;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;

namespace Sentinel.Application.Jobs.TriggerTechHealthScan;

public class TechHealthScanTriggerService(IJobScheduler jobs) : IService
{
    public Result<ApiMessageResponse> Execute()
    {
        jobs.TriggerRecurring(RecurringJobIds.TechHealthScan);

        return ApiMessageResponse.Create(SuccessCodes.JobTriggered);
    }
}
