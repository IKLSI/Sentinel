namespace Sentinel.Domain.Abstractions.Persistence;

public interface IEntityWithId
{
    Guid Id { get; set; }
}
