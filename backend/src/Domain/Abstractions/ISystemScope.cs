namespace Sentinel.Domain.Abstractions;

public interface ISystemScope
{
    bool IsActive { get; }
    IDisposable Enter();
}
