namespace Sentinel.Application.PublicScan;

public sealed class PublicScanThrottle
{
    private const int MaxConcurrentScans = 3;

    private readonly SemaphoreSlim _slots = new(MaxConcurrentScans, MaxConcurrentScans);

    public bool TryEnter() => _slots.Wait(TimeSpan.Zero);

    public void Exit() => _slots.Release();
}
