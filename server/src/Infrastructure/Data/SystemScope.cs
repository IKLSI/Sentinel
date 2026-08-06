using Sentinel.Domain.Abstractions;

namespace Sentinel.Infrastructure.Data;

public sealed class SystemScope : ISystemScope
{
    private readonly AsyncLocal<bool> _active = new();

    public bool IsActive => _active.Value;

    public IDisposable Enter()
    {
        bool previous = _active.Value;
        _active.Value = true;
        return new Releaser(this, previous);
    }

    private sealed class Releaser : IDisposable
    {
        private readonly SystemScope _scope;
        private readonly bool _previous;
        private bool _disposed;

        public Releaser(SystemScope scope, bool previous)
        {
            _scope = scope;
            _previous = previous;
        }

        public void Dispose()
        {
            if (_disposed) return;
            _disposed = true;
            _scope._active.Value = _previous;
        }
    }
}
