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
        Roles = BuildValues<UserRole>(request.Role),
        Statuses = BuildStatuses(request.Status),
        Search = string.IsNullOrWhiteSpace(request.Search) ? null : request.Search
    };

    private static List<UserAccessStatus> BuildStatuses(string[] values)
    {
        List<UserAccessStatus> statuses = BuildValues<UserAccessStatus>(values);

        return statuses.Count > 0 ? statuses : [.. DefaultStatuses];
    }

    private static Result ValidateValues<TValue>(string[] values, string field) where TValue : struct, Enum
    {
        if (values.Length > UserFilterRequest.MaxValuesPerField)
        {
            return Result.Error(ErrorCodes.UserFilterTooManyValues, new Dictionary<string, string>
            {
                ["field"] = field,
                ["maxValues"] = UserFilterRequest.MaxValuesPerField.ToString()
            });
        }

        foreach (string value in values)
        {
            if (!EnumValue.TryParse(value, out TValue _))
            {
                return Result.Error(ErrorCodes.UserFilterValueInvalid, new Dictionary<string, string>
                {
                    ["field"] = field,
                    ["value"] = value
                });
            }
        }

        return Result.Success();
    }

    private static List<TValue> BuildValues<TValue>(string[] values) where TValue : struct, Enum
    {
        List<TValue> parsed = [];

        foreach (string value in values)
        {
            if (EnumValue.TryParse(value, out TValue result) && !parsed.Contains(result))
                parsed.Add(result);
        }

        return parsed;
    }
}
