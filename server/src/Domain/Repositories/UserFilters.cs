using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Repositories;

public sealed record UserFilter
{
    public IReadOnlyList<UserRole> Roles { get; init; } = [];
    public IReadOnlyList<UserAccessStatus> Statuses { get; init; } = [];
    public string? Search { get; init; }
}
