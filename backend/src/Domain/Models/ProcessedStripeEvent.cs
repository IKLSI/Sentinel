using Sentinel.Domain.Abstractions.Persistence;

namespace Sentinel.Domain.Models;

public class ProcessedStripeEvent : IEntityWithId
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public string StripeEventId { get; set; } = string.Empty;
    public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}
