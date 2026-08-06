namespace Sentinel.Infrastructure.Data;

public sealed class TenantSessionState
{
    private readonly Lock _gate = new Lock();
    private string? _appliedValue;

    public bool IsApplied(string value)
    {
        lock (_gate) return _appliedValue == value;
    }

    public void MarkApplied(string value)
    {
        lock (_gate) _appliedValue = value;
    }

    public void Invalidate()
    {
        lock (_gate) _appliedValue = null;
    }
}
