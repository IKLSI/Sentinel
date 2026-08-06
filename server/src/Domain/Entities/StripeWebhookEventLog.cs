using Sentinel.Domain.Abstractions.Persistence;

namespace Sentinel.Domain.Entities;

public class StripeWebhookEventLog : IEntityWithId
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public string StripeEventId { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty;
    public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;
}
