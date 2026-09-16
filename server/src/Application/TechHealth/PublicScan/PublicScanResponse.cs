namespace Sentinel.Application.TechHealth.PublicScan;

public record PublicScanResponse(
    string Grade,
    int Score,
    int DependencyCount,
    int VulnerableDependencyCount,
    int CriticalCount,
    int HighCount,
    int EolRuntimeCount);
