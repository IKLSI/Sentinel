namespace Sentinel.Application.Jobs.GetRecurring;

public record RecurringJobStatusDto(
    string Id,
    string? LastJobState,
    DateTime? LastExecution,
    DateTime? NextExecution,
    string? Error
);
