using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Users.Options;

public class UserOptionListService(
    IUserRepository userRepository,
    ITenantContext tenant) : IService
{
    public async Task<Result<List<UserOptionDto>>> ExecuteAsync(CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<List<UserOptionDto>>.Unauthorized();

        IReadOnlyList<UserOptionRow> users =
            await userRepository.ListOptionsByNameAsync(organizationId, cancellationToken);

        return users.Select(user => new UserOptionDto
        {
            Id = user.Id,
            Name = PersonName.Format(user.FirstName, user.LastName) is { Length: > 0 } name ? name : user.Email
        }).ToList();
    }
}
