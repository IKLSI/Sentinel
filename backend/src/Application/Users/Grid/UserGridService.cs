using Microsoft.EntityFrameworkCore;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.DTOs.Users;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Users.Grid;

public class UserGridService(IUserRepository userRepository, ITenantContext tenant) : IService
{

    public async Task<Result<UserListDto>> ExecuteAsync(UserGridModel model, CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<UserListDto>.Unauthorized();

        int page = model.NormalizedPage;
        int pageSize = model.NormalizedPageSize;

        IQueryable<User> query = userRepository.GetByOrganization(organizationId, QueryableQueryOptions.ReadOnly);

        if (!string.IsNullOrWhiteSpace(model.Search))
        {
            string pattern = SearchPattern.Like(model.Search);

            query = query.Where(u =>
                EF.Functions.ILike(u.FirstName, pattern) ||
                EF.Functions.ILike(u.LastName, pattern) ||
                EF.Functions.ILike(u.Email, pattern));
        }

        int total = await query.CountAsync(cancellationToken);

        List<User> users = await query
            .OrderBy(u => u.LastName)
            .ThenBy(u => u.FirstName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new UserListDto
        {
            Items = users.Select(UserMapper.ToDto).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }
}
