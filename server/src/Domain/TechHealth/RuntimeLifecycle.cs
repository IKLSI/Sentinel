namespace Sentinel.Domain.TechHealth;

public sealed record RuntimeLifecycle(bool? IsEndOfLife, DateTime? EndOfLifeDate, DateTime? ReleaseDate = null);
