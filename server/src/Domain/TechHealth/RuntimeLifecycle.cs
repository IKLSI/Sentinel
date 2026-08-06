namespace Sentinel.Domain.TechHealth;

public sealed record RuntimeLifecycle(bool? IsEndOfLife, DateTime? EndOfLifeDate);
