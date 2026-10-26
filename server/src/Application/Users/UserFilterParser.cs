using Sentinel.Application.Common;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Users;

public static class UserFilterParser
{
    private const string RoleField = "role";
    private const string StatusField = "status";

    private static readonly UserAccessStatus[] DefaultStatuses = [UserAccessStatus.Active];

    public static Result Validate(UserFilterRequest request)
    {
        Result role = ValidateValues<UserRole>(request.Role, RoleField);

        if (!role.IsSuccess)
            return role;

        Result status = ValidateValues<UserAccessStatus>(request.Status, StatusField);

        if (!status.IsSuccess)
            return status;

        if (request.Search is { Length: > UserFilterRequest.SearchMaxLength })
        {
            return Result.Error(ErrorCodes.UserSearchTooLong, new Dictionary<string, string>
            {
                ["maxLength"] = UserFilterRequest.SearchMaxLength.ToString()
            });
        }

        return Result.Success();
    }

    public static UserFilter Build(UserFilterRequest request) => new()
    {
        Roles = FilterValues.ParseDistinct<UserRole>(request.Role),
        Statuses = BuildStatuses(request.Status),
        Search = string.IsNullOrWhiteSpace(request.Search) ? null : request.Search
    };

    private static List<UserAccessStatus> BuildStatuses(string[] values)
    {
        List<UserAccessStatus> statuses = FilterValues.ParseDistinct<UserAccessStatus>(values);

        return statuses.Count > 0 ? statuses : [.. DefaultStatuses];
    }

    private static Result ValidateValues<TValue>(string[] values, string field) where TValue : struct, Enum =>
        FilterValues.Validate<TValue>(values, field, UserFilterRequest.MaxValuesPerField,
            ErrorCodes.UserFilterTooManyValues, ErrorCodes.UserFilterValueInvalid);
}
