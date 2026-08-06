using System.Threading.Channels;
using Sentinel.Domain.Entities;

namespace Sentinel.Application.Audit;

public class AuditLogQueue
{
    private readonly Channel<AuditLog> _channel;
    private long _droppedCount;

    public AuditLogQueue()
    {
        _channel = Channel.CreateBounded<AuditLog>(new BoundedChannelOptions(10_000)
        {
            FullMode = BoundedChannelFullMode.Wait,
            SingleReader = true,
            SingleWriter = false
        });
    }

    public void Enqueue(AuditLog log)
    {
        if (_channel.Writer.TryWrite(log)) return;

        Interlocked.Increment(ref _droppedCount);
    }

    public long ReadAndResetDroppedCount() => Interlocked.Exchange(ref _droppedCount, 0);

    public ChannelReader<AuditLog> Reader => _channel.Reader;
}
