namespace Sentinel.Application.Jobs.GetRecurring;

public record RecurringJobStatusDto(
    string Id,
    string Cron,
    string? LastJobState,
    DateTime? LastExecution,
    DateTime? NextExecution,
    string? Error
);
