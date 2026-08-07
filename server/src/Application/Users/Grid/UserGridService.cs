using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Users.Grid;

public class UserGridService(IUserRepository userRepository, ITenantContext tenant, UserGridValidator validator)
    : IService
{
    public async Task<Result<UserListDto>> ExecuteAsync(UserGridModel model, CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<UserListDto>.Unauthorized();

        Result validationResult = await validator.ValidateAsync(model, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<UserListDto>.From(validationResult);

        int page = model.NormalizedPage;
        int pageSize = model.NormalizedPageSize;

        PagedList<UserGridRow> result = await userRepository.SearchInOrganizationAsync(organizationId,
            UserFilterParser.Build(model), model.SortBy, model.SortDirection, page, pageSize, cancellationToken);

        return new UserListDto
        {
            Items = result.Items.Select(UserMapper.ToDto).ToList(),
            Total = result.TotalCount,
            Page = page,
            PageSize = pageSize
        };
    }
}
