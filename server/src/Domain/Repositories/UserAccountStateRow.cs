using Sentinel.Domain.Entities;

namespace Sentinel.Domain.Repositories;

public sealed record UserAccountStateRow(UserAccessStatus AccessStatus, int TokenVersion);
