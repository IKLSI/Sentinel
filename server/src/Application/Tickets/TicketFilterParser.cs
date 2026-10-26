using Sentinel.Application.Common;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Tickets;

public static class TicketFilterParser
{
    public const string UnsetValue = "none";

    private const string PriorityField = "priority";
    private const string StatusField = "status";
    private const string TypeField = "type";
    private const string AssignedToField = "assignedTo";
    private const string ProjectField = "project";

    public static Result Validate(TicketFilterRequest request)
    {
        Result priority = ValidateValues<TicketPriority>(request.Priority, PriorityField);

        if (!priority.IsSuccess)
            return priority;

        Result status = ValidateValues<TicketStatus>(request.Status, StatusField);

        if (!status.IsSuccess)
            return status;

        Result type = ValidateValues<TicketType>(request.Type, TypeField);

        if (!type.IsSuccess)
            return type;

        Result assignedTo = ValidateReferences(request.AssignedTo, AssignedToField);

        if (!assignedTo.IsSuccess)
            return assignedTo;

        Result project = ValidateReferences(request.Project, ProjectField);

        if (!project.IsSuccess)
            return project;

        if (request.Search is { Length: > TicketFilterRequest.SearchMaxLength })
        {
            return Result.Error(ErrorCodes.TicketSearchTooLong, new Dictionary<string, string>
            {
                ["maxLength"] = TicketFilterRequest.SearchMaxLength.ToString()
            });
        }

        return Result.Success();
    }

    public static TicketFilter Build(TicketFilterRequest request) => new()
    {
        Priority = BuildValues<TicketPriority>(request.Priority),
        Status = BuildValues<TicketStatus>(request.Status),
        Type = BuildValues<TicketType>(request.Type),
        AssignedTo = BuildReferences(request.AssignedTo),
        Project = BuildReferences(request.Project),
        Search = string.IsNullOrWhiteSpace(request.Search) ? null : request.Search
    };

    private static Result ValidateValues<TValue>(string[] values, string field) where TValue : struct, Enum =>
        FilterValues.Validate<TValue>(values, field, TicketFilterRequest.MaxValuesPerField,
            ErrorCodes.TicketFilterTooManyValues, ErrorCodes.TicketFilterValueInvalid);

    private static Result ValidateReferences(string[] values, string field)
    {
        Result countResult = FilterValues.ValidateCount(values, field, TicketFilterRequest.MaxValuesPerField,
            ErrorCodes.TicketFilterTooManyValues);

        if (!countResult.IsSuccess)
            return countResult;

        foreach (string value in values)
        {
            if (!IsUnset(value) && !Guid.TryParse(value, out Guid _))
                return FilterValues.Invalid(field, value, ErrorCodes.TicketFilterValueInvalid);
        }

        return Result.Success();
    }

    private static TicketValueFilter<TValue> BuildValues<TValue>(string[] values) where TValue : struct, Enum =>
        new() { Values = FilterValues.ParseDistinct<TValue>(values) };

    private static TicketReferenceFilter BuildReferences(string[] values)
    {
        List<Guid> ids = [];
        bool includeUnset = false;

        foreach (string value in values)
        {
            if (IsUnset(value))
            {
                includeUnset = true;
                continue;
            }

            if (Guid.TryParse(value, out Guid id) && !ids.Contains(id))
                ids.Add(id);
        }

        return new TicketReferenceFilter { Ids = ids, IncludeUnset = includeUnset };
    }

    private static bool IsUnset(string value) => string.Equals(value, UnsetValue, StringComparison.OrdinalIgnoreCase);
}
