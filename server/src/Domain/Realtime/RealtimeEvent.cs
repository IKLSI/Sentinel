namespace Sentinel.Domain.Realtime;

public record RealtimeEvent(string Resource, Guid? Id = null);
