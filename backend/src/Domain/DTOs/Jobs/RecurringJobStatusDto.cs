namespace Sentinel.Domain.DTOs.Jobs;

public record RecurringJobStatusDto(
    string Id,
    string Cron,
    string? LastJobState,
    DateTime? LastExecution,
    DateTime? NextExecution,
    string? Error
);
