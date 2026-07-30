using Sentinel.Domain.Abstractions.Persistence;

namespace Sentinel.Domain.Models;

public class RevokedToken : IEntityWithId
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Jti { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}
