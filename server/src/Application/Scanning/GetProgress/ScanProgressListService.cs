using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;

namespace Sentinel.Application.Scanning.GetProgress;

public class ScanProgressListService(
    ScanProgressTracker scanProgress,
    ITenantContext tenant) : IService
{
    private static readonly int TotalSteps = Enum.GetValues<ScanStage>().Length;

    public Task<Result<List<ScanProgressDto>>> ExecuteAsync(CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Task.FromResult(Result<List<ScanProgressDto>>.Unauthorized());

        List<ScanProgressDto> progress = scanProgress.ListForOrganization(organizationId)
            .Select(entry => new ScanProgressDto
            {
                ProjectId = entry.ProjectId,
                Stage = entry.Stage.ToString(),
                Step = (int)entry.Stage + 1,
                TotalSteps = TotalSteps
            })
            .ToList();

        return Task.FromResult(Result<List<ScanProgressDto>>.Success(progress));
    }
}
