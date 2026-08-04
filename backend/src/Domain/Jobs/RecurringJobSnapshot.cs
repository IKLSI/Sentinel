namespace Sentinel.Domain.Jobs;

public sealed record RecurringJobSnapshot(
    string Id,
    string Cron,
    string? LastJobState,
    DateTime? LastExecution,
    DateTime? NextExecution,
    string? Error);
