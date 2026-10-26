using Sentinel.Application.Common.Contracts;
using Sentinel.Application.TechHealth.Scan;

namespace Sentinel.Application.TechHealth.ScanProgress;

public class ScanProgressDto
{
    public Guid ProjectId { get; set; }
    [EnumValues(typeof(ScanStage))]
    public string Stage { get; set; } = string.Empty;
    public int Step { get; set; }
    public int TotalSteps { get; set; }
}
