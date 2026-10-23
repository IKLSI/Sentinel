namespace Sentinel.Domain.TechHealth;

public sealed record RuntimeLifecycle(bool? IsEndOfLife, DateTime? EndOfLifeDate, DateTime? ReleaseDate = null)
{
    public bool? IsEolAt(DateTime now) => EndOfLifeDate is DateTime eolDate ? eolDate < now : IsEndOfLife;
}
